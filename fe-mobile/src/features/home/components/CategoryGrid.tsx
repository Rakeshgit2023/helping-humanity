import { Pressable, Text, View } from 'react-native';

import { CATEGORIES, type HelpCategory } from '@/constants/categories';

interface CategoryGridProps {
  onSelect: (category: HelpCategory) => void;
  /** Greys the grid out (e.g. while a request is already live). */
  disabled?: boolean;
}

export function CategoryGrid({ onSelect, disabled = false }: CategoryGridProps) {
  return (
    <View>
      <Text className="mb-2 text-sm font-bold text-ink">What do you want to do?</Text>
      <View className="flex-row flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <Pressable
              key={c.id}
              onPress={() => onSelect(c)}
              disabled={disabled}
              className="items-center gap-1.5 rounded-xl p-3 active:opacity-70"
              style={{ backgroundColor: c.soft, width: '31.5%', opacity: disabled ? 0.4 : 1 }}
            >
              <Icon size={22} color={c.accent} />
              <Text className="text-center text-xs font-semibold text-ink">{c.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
