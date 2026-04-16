const Transaction = require("../models/Transaction");
const Student = require("../models/Student");

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const beginOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setMilliseconds(0);
  return d;
};

const endOfDay = (date) => {
  const d = beginOfDay(date);
  d.setDate(d.getDate() + 1);
  return d;
};

const getReportRange = ({ type, year, month }) => {
  const reportYear = Number(year);
  const reportMonth = Number(month);

  if (type === 'monthly') {
    const start = new Date(reportYear, reportMonth - 1, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(reportYear, reportMonth, 1);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (type === 'yearly') {
    const start = new Date(reportYear, 0, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(reportYear + 1, 0, 1);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }

  return null;
};

exports.addTransaction = async (req, res) => {
  try {
    let { type, amount, category, description, date, studentId, courseId } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ success: false, message: "Type and amount are required" });
    }

    type = type.toLowerCase();
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }

    amount = Number(amount);
    if (Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a valid number' });
    }

    if (!category) {
      category = type === 'income' ? 'fees' : 'other';
    }

    const validCategories = ['fees', 'rent', 'electricity', 'maintenance', 'marketing', 'salary', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction category' });
    }

    const transactionData = {
      type,
      amount,
      category,
      description,
      studentId,
      courseId,
    };

    if (date) {
      transactionData.date = new Date(date);
    }

    const newTransaction = new Transaction(transactionData);
    await newTransaction.save();

    res.status(201).json({ success: true, message: "Transaction added", transaction: newTransaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReportData = async (req, res) => {
  try {
    const { type, year, month, limit } = req.query;
    let reportType = type;
    let start;
    let end;

    if (type) {
      if (type === 'monthly') {
        if (!year || !month) {
          return res.status(400).json({ success: false, message: 'Year and month are required for monthly reports' });
        }

        const range = getReportRange({ type, year, month });
        start = range.start;
        end = range.end;
      } else if (type === 'yearly') {
        if (!year) {
          return res.status(400).json({ success: false, message: 'Year is required for yearly reports' });
        }

        const range = getReportRange({ type, year });
        start = range.start;
        end = range.end;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid report type' });
      }
    }

    const students = await Student.find();
    console.log('Students:', students.length);

    const studentIncomeTransactions = students.reduce((acc, student) => {
      const amount = Number(student.feesPaid || 0);
      if (amount > 0) {
        acc.push({
          date: student.createdAt || student.enrollmentDate || new Date(),
          description: `Fees Paid - ${student.name}`,
          type: 'income',
          amount,
          studentId: student._id
        });
      }
      return acc;
    }, []);

    const expenseQuery = { type: 'expense' };
    if (start && end) {
      expenseQuery.date = { $gte: start, $lt: end };
    }

    const expenseTransactions = await Transaction.find(expenseQuery).sort({ date: -1 });

    let allTransactions = [...studentIncomeTransactions, ...expenseTransactions];
    if (start && end) {
      allTransactions = allTransactions.filter(t => {
        const date = new Date(t.date);
        return date >= start && date < end;
      });
    }

    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const revenue = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const profit = revenue - expenses;

    const categoryAggregation = await Transaction.aggregate([
      { $match: expenseQuery },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    const categoryTotals = {};
    categoryAggregation.forEach(item => {
      categoryTotals[item._id] = item.total;
    });

    const chartMap = {};
    allTransactions.forEach(t => {
      const date = new Date(t.date);
      let label;
      if (type === 'monthly') {
        label = String(date.getDate());
      } else if (type === 'yearly') {
        label = monthNames[date.getMonth()];
      } else {
        label = date.toLocaleDateString();
      }

      if (!chartMap[label]) {
        chartMap[label] = { income: 0, expenses: 0 };
      }

      if (t.type === 'income') {
        chartMap[label].income += Number(t.amount || 0);
      } else {
        chartMap[label].expenses += Number(t.amount || 0);
      }
    });

    let chartLabels = Object.keys(chartMap);
    if (type === 'yearly') {
      chartLabels = monthNames.filter(label => chartLabels.includes(label));
    } else if (type === 'monthly') {
      chartLabels = chartLabels.sort((a, b) => Number(a) - Number(b));
    } else {
      chartLabels = chartLabels.sort((a, b) => new Date(a) - new Date(b));
    }

    const incomeSeries = chartLabels.map(label => chartMap[label]?.income || 0);
    const expenseSeries = chartLabels.map(label => chartMap[label]?.expenses || 0);

    const reportLimit = Number(limit) || 0;
    const transactions = reportLimit > 0 ? allTransactions.slice(0, reportLimit) : allTransactions;

    return res.status(200).json({
      success: true,
      transactions,
      stats: {
        revenue,
        expenses,
        profit
      },
      chart: {
        labels: chartLabels,
        income: incomeSeries,
        expenses: expenseSeries
      },
      categoryTotals,
      reportType,
      totalStudents: students.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFinancialStats = async (req, res) => {
  try {
    // Calculate revenue from students' feesPaid
    const students = await Student.find();
    const revenue = students.reduce((sum, student) => sum + (student.feesPaid || 0), 0);

    // Calculate expenses from transactions
    const expenseData = await Transaction.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const expenses = expenseData.length > 0 ? expenseData[0].total : 0;
    const profit = revenue - expenses;

    console.log('Total revenue from students:', revenue);
    console.log('Total expenses:', expenses);

    res.status(200).json({
      success: true,
      stats: {
        revenue,
        expenses,
        profit,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransactionsFromStudents = async (req, res) => {
  try {
    const students = await Student.find();
    console.log('Students for transactions:', students.length);

    const transactions = students.reduce((acc, student) => {
      const amount = Number(student.feesPaid || 0);
      if (amount > 0) {
        acc.push({
          date: student.createdAt || student.enrollmentDate || new Date(),
          description: `Fees Paid - ${student.name}`,
          type: 'income',
          amount
        });
      }
      return acc;
    }, []);

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('Generated transactions from feesPaid:', transactions.length);

    res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
