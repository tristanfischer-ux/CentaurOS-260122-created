import { View, Text } from 'react-native';

interface TabDescriptionProps {
  description: string;
}

export function TabDescription({ description }: TabDescriptionProps) {
  return (
    <View className="px-6 pt-4 pb-3 border-b border-gray-200 dark:border-slate-800">
      <Text className="text-gray-600 dark:text-slate-400 text-sm leading-5">
        {description}
      </Text>
    </View>
  );
}
