const calculateSplit = (amountPaise, splitType, participants) => {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error("INVALID_PARTICIPANTS");
  }

  const userIds = participants.map((participant) => {
    if (typeof participant === "string") {
      return participant;
    }

    return participant.userId;
  });

  if (userIds.some((userId) => !userId)) {
    throw new Error("INVALID_PARTICIPANT");
  }

  if (new Set(userIds).size !== userIds.length) {
    throw new Error("DUPLICATE_PARTICIPANTS");
  }

  switch (splitType) {
    case "equal":
      return calculateEqualSplit(amountPaise, userIds);

    case "exact":
      return calculateExactSplit(amountPaise, participants);

    case "percentage":
      return calculatePercentageSplit(amountPaise, participants);

    default:
      throw new Error("INVALID_SPLIT_TYPE");
  }
};

// Equal split
const calculateEqualSplit = (amountPaise, userIds) => {
  const count = userIds.length;

  const baseAmount = Math.floor(amountPaise / count);
  const remainder = amountPaise % count;

  return userIds.map((userId, index) => ({
    userId,
    amountPaise: baseAmount + (index < remainder ? 1 : 0),
  }));
};

// Exact split
const calculateExactSplit = (amountPaise, participants) => {
  let total = 0;

  const result = participants.map((participant) => {
    const participantAmount = participant.amountPaise;

    if (!Number.isInteger(participantAmount) || participantAmount < 0) {
      throw new Error("INVALID_EXACT_AMOUNT");
    }

    total += participantAmount;

    return {
      userId: participant.userId,
      amountPaise: participantAmount,
    };
  });

  if (total !== amountPaise) {
    throw new Error("EXACT_SPLIT_TOTAL_MISMATCH");
  }

  return result;
};

// Percentage split
const calculatePercentageSplit = (amountPaise, participants) => {
  let totalPercentage = 0;

  for (const participant of participants) {
    const percentage = participant.percentage;

    if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
      throw new Error("INVALID_PERCENTAGE");
    }

    totalPercentage += percentage;
  }

  if (totalPercentage !== 100) {
    throw new Error("PERCENTAGE_TOTAL_MISMATCH");
  }

  const result = participants.map((participant) => {
    return {
      userId: participant.userId,
      amountPaise: Math.floor((amountPaise * participant.percentage) / 100),
    };
  });

  // Handle rounding remainder
  const calculatedTotal = result.reduce(
    (sum, participant) => sum + participant.amountPaise,
    0
  );

  const remainder = amountPaise - calculatedTotal;

  if (remainder > 0) {
    result[result.length - 1].amountPaise += remainder;
  }

  return result;
};

module.exports = {
  calculateSplit,
};
