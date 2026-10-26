import mongoose from 'mongoose';
const expenseSchema = new mongoose.Schema({
 title: { type: String, required: true, trim: true, maxlength: 100 },
 amount: { type: Number, required: true, min: 0.01, max: 10000000 },
 category: { type: String, required: true, enum: ['Food', 'Transport', 'Study', 'Housing', 'Entertainment', 'Health', 'Other'] },
 date: { type: Date, required: true, default: Date.now },
 note: { type: String, trim: true, maxlength: 500, default: '' },
 paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Other'], default: 'UPI' }
}, { timestamps: true, versionKey: false });
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });
export default mongoose.model('Expense', expenseSchema);
