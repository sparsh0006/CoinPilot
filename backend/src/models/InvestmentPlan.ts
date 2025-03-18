import mongoose, { Schema, Document } from 'mongoose';

export enum RiskLevel {
  NO_RISK = 'no_risk',
  LOW_RISK = 'low_risk',
  MEDIUM_RISK = 'medium_risk',
  HIGH_RISK = 'high_risk'
}

export interface IInvestmentPlan extends Document {
  _id: mongoose.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  amount: number;
  frequency: string; // 'minute', 'hour', 'day'
  toAddress: string;
  isActive: boolean;
  lastExecutionTime: Date;
  totalInvested: number;
  createdAt: Date;
  updatedAt: Date;
  executionCount: number;
  initialAmount: number;
  riskLevel: RiskLevel;
}

const InvestmentPlanSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  initialAmount: { type: Number, required: true },
  frequency: { 
    type: String, 
    required: true,
    enum: ['minute', 'hour', 'day']
  },
  toAddress: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastExecutionTime: { type: Date, default: null },
  totalInvested: { type: Number, default: 0 },
  executionCount: { type: Number, default: 0 },
  riskLevel: { 
    type: String, 
    enum: Object.values(RiskLevel),
    default: RiskLevel.NO_RISK,
    required: true 
  }
}, {
  timestamps: true
});

export const InvestmentPlan = mongoose.model<IInvestmentPlan>('InvestmentPlan', InvestmentPlanSchema);