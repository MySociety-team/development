import Finance from "../../models/Finance.js";
import Flat from "../../models/Flat.js";

export const findFinanceRecordsBySociety = async (societyId, filters = {}) => {
  const query = { societyId };

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.search) {
    const matchingFlats = await Flat.find({
      societyId,
      flatNumber: {
        $regex: filters.search,
        $options: "i"
      }
    })
      .select("_id")
      .lean();

    const flatIds = matchingFlats.map((flat) => flat._id);

    query.$or = [
      {
        title: {
          $regex: filters.search,
          $options: "i"
        }
      },
      {
        description: {
          $regex: filters.search,
          $options: "i"
        }
      },
      {
        category: {
          $regex: filters.search,
          $options: "i"
        }
      },
      {
        flatId: {
          $in: flatIds
        }
      }
    ];
  }

  return Finance.find(query)
    .populate("createdBy", "name email")
    .populate("flatId", "flatNumber")
    .sort({
      date: -1,
      createdAt: -1
    });
};

export const findFinanceById = async (financeId, societyId) => {
  return Finance.findOne({
    _id: financeId,
    societyId
  }).populate("createdBy", "name email");
};

export const createFinanceRecord = async (financeData) => {
  return Finance.create(financeData);
};

export const updateFinanceRecord = async (financeId, societyId, updateData) => {
  return Finance.findOneAndUpdate(
    {
      _id: financeId,
      societyId
    },
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate("createdBy", "name email");
};

export const deleteFinanceRecord = async (financeId, societyId) => {
  return Finance.findOneAndDelete({
    _id: financeId,
    societyId
  });
};
export const getFinanceSummary = async (societyId) => {
  const summary = await Finance.aggregate([
    {
      $match: {
        societyId: new Finance.base.Types.ObjectId(societyId)
      }
    },
    {
      $group: {
        _id: "$type",
        total: {
          $sum: "$amount"
        }
      }
    }
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;

  summary.forEach((item) => {
    if (item._id === "INCOME") {
      totalIncome = item.total;
    }

    if (item._id === "EXPENSE") {
      totalExpenses = item.total;
    }
  });

  return {
    totalIncome,
    totalExpenses,
    currentBalance: totalIncome - totalExpenses
  };
};
export const findFinanceBySourcePaymentId = async (sourcePaymentId) => {
  return Finance.findOne({
    sourceType: "MAINTENANCE_PAYMENT",
    sourcePaymentId
  });
};
