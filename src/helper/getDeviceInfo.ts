/**
 * getDeviceInfo — minimal user-agent → device shape.
 *
 * Intentionally lightweight: we only extract the OS / browser / device
 * strings we actually use. For richer parsing plug in `node-device-detector`
 * or similar — that dependency is intentionally NOT bundled.
 */
export type LoginDeviceInfo = {
  os?: {
    name?: string;
    version?: string;
  };
  client?: {
    name?: string;
    version?: string;
    type?: string;
  };
  device?: {
    type?: string;
    brand?: string;
    model?: string;
  };
};

export const getDeviceInfo = (
  userAgent: string | undefined,
): LoginDeviceInfo | null => {
  if (!userAgent) return null;

  const osMatch = /\(([^)]+)\)/.exec(userAgent);
  const osString = osMatch ? osMatch[1] : "";

  return {
    os: {
      name: osString.split(";")[0]?.trim() || undefined,
    },
    client: {
      name: /Edg\/|Chrome\/|Firefox\/|Safari\//.exec(userAgent)?.[0],
    },
    device: {
      type: /Mobile|Tablet/.test(userAgent)
        ? /Tablet/.test(userAgent)
          ? "tablet"
          : "mobile"
        : "desktop",
    },
  };
};