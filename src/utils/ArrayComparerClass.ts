type InputConfig<T> = {
  payload: T[];
  key: keyof T;
};

type ResultBlock<T> = {
  itemsArray: T[];
  idArray: T[keyof T][];
};

type CompareResult<T1, T2> = {
  matched: ResultBlock<T2>;
  new: ResultBlock<T2>;
  onlyInArray1: ResultBlock<T1>;
};

export class ArrayComparerClass<T1, T2> {
  private array1: T1[];
  private array2: T2[];
  private key1: keyof T1;
  private key2: keyof T2;

  constructor(array1Config: InputConfig<T1>, array2Config: InputConfig<T2>) {
    this.array1 = array1Config.payload;
    this.array2 = array2Config.payload;
    this.key1 = array1Config.key;
    this.key2 = array2Config.key;
  }

  public compare(): CompareResult<T1, T2> {
    const map1 = new Map<any, T1>();
    for (const item of this.array1) {
      map1.set(item[this.key1], item);
    }

    const map2 = new Map<any, T2>();
    for (const item of this.array2) {
      map2.set(item[this.key2], item);
    }

    const matched: T2[] = [];
    const newOnes: T2[] = [];
    const onlyInArray1: T1[] = [];

    for (const [id, item2] of map2.entries()) {
      if (map1.has(id)) {
        matched.push(item2);
      } else {
        newOnes.push(item2);
      }
    }

    for (const [id, item1] of map1.entries()) {
      if (!map2.has(id)) {
        onlyInArray1.push(item1);
      }
    }

    return {
      matched: {
        itemsArray: matched,
        idArray: matched.map(item => item[this.key2]),
      },
      new: {
        itemsArray: newOnes,
        idArray: newOnes.map(item => item[this.key2]),
      },
      onlyInArray1: {
        itemsArray: onlyInArray1,
        idArray: onlyInArray1.map(item => item[this.key1]),
      },
    };
  }
}

export function comparePermissions(
  alreadyAssigned: string[],
  newSendPayload: string[],
) {
  const existingIds = alreadyAssigned;
  const newIds = newSendPayload;

  const matched = [];
  const newOnes = [];
  const invalid = [];

  for (const id of newIds) {
    if (existingIds.includes(id)) {
      matched.push(id);
    } else {
      newOnes.push(id);
    }
  }

  for (const id of existingIds) {
    if (!newIds.includes(id)) {
      invalid.push(id); // present in first array but not in second
    }
  }

  return {
    matched,
    new: newOnes,
    invalid, // optional, in case you want to know what's missing in new payload
  };
}

export function splitByMatch<T>(
  array1: T[],
  array2: T[],
): { matched: T[]; unmatched: T[] } {
  const set2 = new Set(array2);
  const matched: T[] = [];
  const unmatched: T[] = [];

  for (const item of array1) {
    if (set2.has(item)) {
      matched.push(item);
    } else {
      unmatched.push(item);
    }
  }

  return { matched, unmatched };
}

// type InputConfig<T> = {
//   payload: T[];
//   key: keyof T;
// };

// type ResultBlock<T> = {
//   itemsArray: T[];
//   idArray: T[keyof T][];
// };

// type CompareResult<T1, T2> = {
//   matched: ResultBlock<T2>;
//   new: ResultBlock<T2>;
//   onlyInArray1: ResultBlock<T1>;
// };

// export function compareArrays<T1, T2>(
//   array1Config: InputConfig<T1>,
//   array2Config: InputConfig<T2>,
// ): CompareResult<T1, T2> {
//   const { payload: array1, key: key1 } = array1Config;
//   const { payload: array2, key: key2 } = array2Config;

//   // Create maps for fast lookup
//   const map1 = new Map<any, T1>();
//   for (const item of array1) {
//     map1.set(item[key1], item);
//   }

//   const map2 = new Map<any, T2>();
//   for (const item of array2) {
//     map2.set(item[key2], item);
//   }

//   const matched: T2[] = [];
//   const newOnes: T2[] = [];
//   const onlyInArray1: T1[] = [];

//   // Compare array2 against map1
//   for (const [id, item2] of map2.entries()) {
//     if (map1.has(id)) {
//       matched.push(item2);
//     } else {
//       newOnes.push(item2);
//     }
//   }

//   // Compare array1 against map2 to find what's missing
//   for (const [id, item1] of map1.entries()) {
//     if (!map2.has(id)) {
//       onlyInArray1.push(item1);
//     }
//   }

//   return {
//     matched: {
//       itemsArray: matched,
//       idArray: matched.map(item => item[key2]),
//     },
//     new: {
//       itemsArray: newOnes,
//       idArray: newOnes.map(item => item[key2]),
//     },
//     onlyInArray1: {
//       itemsArray: onlyInArray1,
//       idArray: onlyInArray1.map(item => item[key1]),
//     },
//   };
// }
