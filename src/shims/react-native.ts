export const Platform = {
  OS: 'web',
  select: (obj: Record<string, any>) => obj.web ?? obj.default,
};

export const View = ({ children }: any) => children ?? null;
export const Text = ({ children }: any) => children ?? null;

export default {
  Platform,
  View,
  Text,
};
