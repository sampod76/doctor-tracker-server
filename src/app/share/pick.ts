// modiul
const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Partial<T> => {
  const finalObj: Partial<T> = {};

  for (const key of keys) {
    if (obj && Object.hasOwnProperty.call(obj, key)) {
      if (obj[key]) {
        finalObj[key] = obj[key];
        // obj[key] === 'true' ? true : obj[key] === 'false' ? false : obj[key];
      }
    }
  }

  return finalObj;
};

export default pick;

//
