export const computePower = (power) => {
  power.amount = power.amount || 0;
  const amount =
    power.amount +
    Math.floor(
      (Date.now() - power.lastAutoHealedAt.seconds * 1000) /
        (power.healSecPerPower * 1000)
    );
  const nextAutoHealedAt =
    power.lastAutoHealedAt.seconds +
    (amount - power.amount + 1) * power.healSecPerPower;
  return {
    amount,
    nextAutoHealedAt,
  };
};
