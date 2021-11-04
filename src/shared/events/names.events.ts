export const compareEventNamePrefix = 'compare';
export const readEventNamePrefix = 'read';

export function getEventName(
  prefix: typeof compareEventNamePrefix | typeof readEventNamePrefix,
  type: number,
) {
  return prefix + type.toString();
}