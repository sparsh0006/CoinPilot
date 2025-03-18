import { DCAPlugin } from '../plugins/types';
import { InjectivePlugin } from '../plugins/injective';
import { TonPlugin } from '../plugins/ton';
import { InvestmentPlan, IInvestmentPlan, RiskLevel } from '../models/InvestmentPlan';
import { User, IUser } from '../models/User';
import cron from 'node-cron';
import { logger } from '../utils/logger';
import { analyzeTokenPrice, getRiskMultiplier } from './PriceAnalysisService';

export class DCAService {
  private plugin: DCAPlugin;
  private cronJobs: Map<string, cron.ScheduledTask>;

  constructor() {
    this.plugin = process.env.BLOCKCHAIN_PLUGIN === 'ton' ? new TonPlugin() : new InjectivePlugin();
    this.cronJobs = new Map();
    this.initializeExistingPlans();
  }

  private async initializeExistingPlans() {
    try {
      const activePlans = await InvestmentPlan.find({ isActive: true });
      activePlans.forEach(plan => this.schedulePlan(plan));
    } catch (error) {
      logger.error('Failed to initialize existing plans:', error);
    }
  }

  private getCronExpression(frequency: string): string {
    switch (frequency) {
      case 'minute':
        return '* * * * *';
      case 'hour':
        return '0 * * * *';
      case 'day':
        return '0 0 * * *';
      default:
        throw new Error('Invalid frequency');
    }
  }

  private async executePlan(plan: IInvestmentPlan) {
    try {
      const user = await User.findById(plan.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get the execution amount
      let executionAmount = plan.amount;

      // If this is not the first execution, apply risk-based strategy
      if (plan.executionCount > 0) {
        // Get price analysis for Injective token
        const analysis = await analyzeTokenPrice('sonic-svm');
        
        // Get risk multiplier based on user's selected risk level
        const riskMultiplier = getRiskMultiplier(plan.riskLevel as RiskLevel);
        
        // Calculate updated amount based on risk level
        const updatedAmount = plan.initialAmount * riskMultiplier;
        
        // Calculate the random number component based on price factor
        const randomNumber = (updatedAmount - plan.initialAmount) * analysis.priceFactor;
        
        // Apply the formula based on price trend
        if (analysis.isPriceGoingUp) {
          // If price going up: FP = UA - RN
          executionAmount = updatedAmount - randomNumber;
        } else {
          // If price going down: FP = UA + RN
          executionAmount = updatedAmount + randomNumber;
        }
        
        logger.info(`Plan ${plan._id}: Applied risk-based strategy
          Risk Level: ${plan.riskLevel}, Risk Multiplier: ${riskMultiplier}
          Price Factor: ${analysis.priceFactor}, Price Trend: ${analysis.isPriceGoingUp ? 'Up' : 'Down'}
          Initial Amount: ${plan.initialAmount}, Updated Amount: ${updatedAmount}
          Random Component: ${randomNumber}, Final Amount: ${executionAmount}`);
      }

      // Execute the transaction with the calculated amount
      const txHash = await this.plugin.sendTransaction(
        executionAmount,
        user.address,
        plan.toAddress
      );

      // Update plan data
      plan.lastExecutionTime = new Date();
      plan.totalInvested += executionAmount;
      plan.executionCount += 1;
      
      // After first execution, save the initial amount for future calculations
      if (plan.executionCount === 1) {
        plan.initialAmount = plan.amount;
      }
      
      await plan.save();

      logger.info(`Successfully executed DCA plan: ${plan._id}, txHash: ${txHash}, amount: ${executionAmount}`);
    } catch (error) {
      logger.error(`Failed to execute DCA plan: ${plan._id}`, error);
    }
  }

  private schedulePlan(plan: IInvestmentPlan) {
    const cronExpression = this.getCronExpression(plan.frequency);
    const job = cron.schedule(cronExpression, () => this.executePlan(plan));
    this.cronJobs.set(plan._id.toString(), job);
  }

  async createPlan(userId: string, planData: {
    amount: number;
    frequency: string;
    toAddress: string;
    riskLevel: RiskLevel;
  }): Promise<IInvestmentPlan> {
    const plan = await InvestmentPlan.create({
      userId,
      ...planData,
      initialAmount: planData.amount,
      isActive: true,
      executionCount: 0
    });

    this.schedulePlan(plan);
    return plan;
  }

  async stopPlan(planId: string): Promise<IInvestmentPlan | null> {
    const plan = await InvestmentPlan.findById(planId);
    if (!plan) {
      return null;
    }

    plan.isActive = false;
    await plan.save();

    const job = this.cronJobs.get(planId);
    if (job) {
      job.stop();
      this.cronJobs.delete(planId);
    }

    return plan;
  }

  async getUserPlans(userId: string): Promise<IInvestmentPlan[]> {
    return InvestmentPlan.find({ userId });
  }

  async getUserTotalInvestment(userId: string): Promise<number> {
    const result = await InvestmentPlan.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: null, total: { $sum: '$totalInvested' } } }
    ]);
    return result.length > 0 ? result[0].total : 0;
  }
}