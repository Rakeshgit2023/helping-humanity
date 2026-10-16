import { X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import { CATEGORIES } from '@/constants/categories';
import { brand } from '@/theme';

interface NewRequestSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (categoryId: string) => void;
}

/** Bottom sheet: "What do you need help with?" */
export function NewRequestSheet({ visible, onClose, onSelect }: NewRequestSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <View className="w-full max-w-xl self-center rounded-t-3xl bg-paper p-4 pb-8">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-bold text-ink">What do you need help with?</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={20} color={brand.inkSoft} />
            </Pressable>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => onSelect(c.id)}
                  className="items-center gap-1.5 rounded-xl p-3 active:opacity-70"
                  style={{ backgroundColor: c.soft, width: '31.5%' }}
                >
                  <Icon size={22} color={c.accent} />
                  <Text className="text-center text-xs font-semibold text-ink">{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="mt-3 text-center text-xs text-ink-soft">
            Nearby volunteers get notified instantly — always free.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
