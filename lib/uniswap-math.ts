const MIN_TICK = -887272;
const MAX_TICK = 887272;
const Q96 = BigInt(2) ** BigInt(96);
const MAX_UINT256 = (BigInt(2) ** BigInt(256)) - BigInt(1);

const multipliers = [
  "0xfffcb933bd6fad37aa2d162d1a594001",
  "0xfff97272373d413259a46990580e213a",
  "0xfff2e50f5f656932ef12357cf3c7fdcc",
  "0xffe5caca7e10e4e61c3624eaa0941cd0",
  "0xffcb9843d60f6159c9db58835c926644",
  "0xff973b41fa98c081472e6896dfb254c0",
  "0xff2ea16466c96a3843ec78b326b52861",
  "0xfe5dee046a99a2a811c461f1969c3053",
  "0xfcbe86c7900a88aedcffc83b479aa3a4",
  "0xf987a7253ac413176f2b074cf7815e54",
  "0xf3392b0822b70005940c7a398e4b70f3",
  "0xe7159475a2c29b7443b29c7fa6e889d9",
  "0xd097f3bdfd2022b8845ad8f792aa5825",
  "0xa9f746462d870fdf8a65dc1f90e061e5",
  "0x70d869a156d2a1b890bb3df62baf32f7",
  "0x31be135f97d08fd981231505542fcfa6",
  "0x9aa508b5b7a84e1c677de54f3e99bc9",
  "0x5d6af8dedb81196699c329225ee604",
  "0x2216e584f5fa1ea926041bedfe98",
  "0x48a170391f7dc42444e8fa2",
].map(BigInt);

export function sqrtRatioAtTick(tick: number) {
  if (!Number.isInteger(tick) || tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error(`Uniswap tick ${tick} is outside the supported range`);
  }
  const absoluteTick = Math.abs(tick);
  let ratio = (absoluteTick & 1) !== 0
    ? multipliers[0]
    : BigInt("0x100000000000000000000000000000000");

  for (let bit = 1; bit < multipliers.length; bit += 1) {
    if ((absoluteTick & (1 << bit)) !== 0) {
      ratio = (ratio * multipliers[bit]) >> BigInt(128);
    }
  }
  if (tick > 0) ratio = MAX_UINT256 / ratio;

  const remainderMask = (BigInt(1) << BigInt(32)) - BigInt(1);
  return (ratio >> BigInt(32)) + ((ratio & remainderMask) === BigInt(0) ? BigInt(0) : BigInt(1));
}

function amount0ForLiquidity(sqrtPriceA: bigint, sqrtPriceB: bigint, liquidity: bigint) {
  const [lower, upper] = sqrtPriceA < sqrtPriceB
    ? [sqrtPriceA, sqrtPriceB]
    : [sqrtPriceB, sqrtPriceA];
  return (((liquidity << BigInt(96)) * (upper - lower)) / upper) / lower;
}

function amount1ForLiquidity(sqrtPriceA: bigint, sqrtPriceB: bigint, liquidity: bigint) {
  const [lower, upper] = sqrtPriceA < sqrtPriceB
    ? [sqrtPriceA, sqrtPriceB]
    : [sqrtPriceB, sqrtPriceA];
  return (liquidity * (upper - lower)) / Q96;
}

export function amountsForLiquidity(
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number,
  liquidity: bigint,
) {
  const lower = sqrtRatioAtTick(tickLower);
  const upper = sqrtRatioAtTick(tickUpper);
  if (sqrtPriceX96 <= lower) {
    return { amount0: amount0ForLiquidity(lower, upper, liquidity), amount1: BigInt(0) };
  }
  if (sqrtPriceX96 < upper) {
    return {
      amount0: amount0ForLiquidity(sqrtPriceX96, upper, liquidity),
      amount1: amount1ForLiquidity(lower, sqrtPriceX96, liquidity),
    };
  }
  return { amount0: BigInt(0), amount1: amount1ForLiquidity(lower, upper, liquidity) };
}
