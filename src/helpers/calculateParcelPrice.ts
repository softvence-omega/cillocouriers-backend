const calculateParcelPrice = (weight: string, length: string, width: string, height: string) => {
  // Calculate cubic centimeters
  let cubicCent = parseFloat(length) * parseFloat(width) * parseFloat(height);

  // Calculate extra weight charge
  let extraWeight = 0;
  if (parseFloat(weight) > 16 && parseFloat(weight) < 26) {
    extraWeight = 500;
  } else if (parseFloat(weight) > 10 && parseFloat(weight) < 16) {
    extraWeight = 300;
  } else if (parseFloat(weight) > 25) {
    extraWeight = parseFloat(weight) * 6;
  }

  // Convert cubicCent to appropriate units (divide by 100)
  cubicCent = cubicCent / 100;

  // Final total calculation
  const total = cubicCent + extraWeight + 1000;

  return total;
};

export default calculateParcelPrice;