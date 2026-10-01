type ByteConversion = {
  KB: number;
  MB: number;
};

export function bytesToKbAndMb(bytes: number): ByteConversion {
  const k = 1024;

  // Convert bytes to kilobytes and megabytes
  const kb = bytes / k;
  const mb = kb / k;

  // Return an object with both values
  return {
    KB: kb,
    MB: mb,
  };
}

// Example usage:
// const bytes = 2097152; // 2 MB in bytes
// const result = bytesToKbAndMb(bytes);
// console.log(result); // Output: { KB: 2048, MB: 2 }
