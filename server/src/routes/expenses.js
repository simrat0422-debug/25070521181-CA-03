import { Router } from 'express';
import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
const router = Router();
const fields = ['title', 'amount', 'category', 'date', 'note', 'paymentMethod'];
const validId = id => mongoose.isValidObjectId(id);
const rangeForMonth = month => {
 if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
 const [year, value] = month.split('-').map(Number);
 return { $gte: new Date(Date.UTC(year, value - 1, 1)), $lt: new Date(Date.UTC(year, value, 1)) };
};
router.get('/summary', async (req, res, next) => {
 try {
  const date = rangeForMonth(req.query.month);
  if (!date) return res.status(400).json({ message: 'Provide month as YYYY-MM.' });
  const [summary] = await Expense.aggregate([
   { $match: { date } },
   { $facet: {
    totals: [{ $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }],
    categories: [{ $group: { _id: '$category', amount: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { amount: -1 } }]
   } }
  ]);
  res.json({ total: summary.totals[0]?.amount ?? 0, count: summary.totals[0]?.count ?? 0, categories: summary.categories });
 } catch (error) { next(error); }
});
router.get('/', async (req, res, next) => {
 try {
  const { month, category, search } = req.query, filter = {};
  if (month) { const date = rangeForMonth(month); if (!date) return res.status(400).json({ message: 'Provide month as YYYY-MM.' }); filter.date = date; }
  if (['Food','Transport','Study','Housing','Entertainment','Health','Other'].includes(category)) filter.category = category;
  if (typeof search === 'string' && search.trim()) {
   const escaped = search.trim().replaceAll('\\', '\\\\').replaceAll('.', '\\.').replaceAll('*', '\\*').replaceAll('+', '\\+').replaceAll('?', '\\?').replaceAll('^', '\\^').replaceAll('$', '\\$').replaceAll('{', '\\{').replaceAll('}', '\\}').replaceAll('(', '\\(').replaceAll(')', '\\)').replaceAll('|', '\\|').replaceAll('[', '\\[').replaceAll(']', '\\]');
   filter.$or = [{ title: { $regex: escaped, $options: 'i' } }, { note: { $regex: escaped, $options: 'i' } }];
  }
  res.json(await Expense.find(filter).sort({ date: -1, createdAt: -1 }).lean());
 } catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
 try {
  const body = req.body ?? {}, expense = await Expense.create(Object.fromEntries(fields.filter(key => key in body).map(key => [key, body[key]])));
  res.status(201).json(expense);
 } catch (error) { next(error); }
});
router.patch('/:id', async (req, res, next) => {
 try {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid expense id.' });
  const body = req.body ?? {}, updates = Object.fromEntries(fields.filter(key => key in body).map(key => [key, body[key]]));
  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Provide at least one expense field to update.' });
  const expense = await Expense.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!expense) return res.status(404).json({ message: 'Expense not found.' });
  res.json(expense);
 } catch (error) { next(error); }
});
router.delete('/:id', async (req, res, next) => {
 try {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid expense id.' });
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found.' });
  res.status(204).end();
 } catch (error) { next(error); }
});
export default router;
