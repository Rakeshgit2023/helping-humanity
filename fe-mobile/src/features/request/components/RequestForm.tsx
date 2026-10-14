import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, MapPin, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLocationStore } from '@/store/locationStore';
import { brand } from '@/theme';

import {
  BLOOD_GROUPS,
  CATEGORY_DEFAULTS,
  getCategory,
  MAX_PHOTOS,
  PRIORITIES,
} from '../constants/request.constants';
import type { RequestDraft, RequestPriority } from '../types/request.types';

interface RequestFormProps {
  categoryId: string;
  onBack: () => void;
  onSubmit: (draft: RequestDraft) => void;
}

export function RequestForm({ categoryId, onBack, onSubmit }: RequestFormProps) {
  const cat = getCategory(categoryId);
  const defaults = CATEGORY_DEFAULTS[categoryId];
  const Icon = cat.icon;
  const lastCoords = useLocationStore((s) => s.lastCoords);

  // photos is a fixed 2-slot array so slot 2 can be empty while slot 1 is filled.
  const [photos, setPhotos] = useState<(string | null)[]>([null, null]);
  const [priority, setPriority] = useState<RequestPriority>(defaults?.urgent ? 'Urgent' : 'Normal');
  const [description, setDescription] = useState(defaults?.description ?? '');
  const [bloodGroup, setBloodGroup] = useState<string | null>(null);

  const photoCount = photos.filter(Boolean).length;
  const canSend = description.trim().length > 0 && (categoryId !== 'blood' || !!bloodGroup);

  const pickPhoto = async (slot: number) => {
    if (slot === 1 && !photos[0]) return; // 2nd slot unlocks after the 1st
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) {
      Alert.alert('Could not add photo', 'Please try another image.');
      return;
    }
    setPhotos((cur) => cur.map((p, i) => (i === slot ? uri : p)));
  };

  const removePhoto = (slot: number) =>
    setPhotos((cur) => {
      const next = cur.map((p, i) => (i === slot ? null : p));
      // keep photos packed to the left: [null, x] -> [x, null]
      return next[0] ? next : [next[1], null];
    });

  const submit = () =>
    onSubmit({
      categoryId,
      description: description.trim(),
      priority,
      bloodGroup,
      photos: photos.filter((p): p is string => !!p),
      coords: lastCoords,
    });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center gap-2 border-b border-line px-3 py-3">
        <Pressable onPress={onBack} hitSlop={12}>
          <ArrowLeft size={22} color={brand.ink} />
        </Pressable>
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: cat.soft }}
        >
          <Icon size={17} color={cat.accent} />
        </View>
        <Text className="text-base font-bold text-ink">New {cat.label} request</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 p-4"
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-ink">Photo</Text>
            <Text className="text-xs text-ink-soft">
              {photoCount}/{MAX_PHOTOS} added
            </Text>
          </View>
          <View className="flex-row gap-2">
            {[0, 1].map((slot) => {
              const photo = photos[slot];
              const locked = slot === 1 && !photos[0];
              return (
                <Pressable
                  key={slot}
                  onPress={() => pickPhoto(slot)}
                  className="flex-1 items-center justify-center overflow-hidden rounded-2xl active:opacity-80"
                  style={{
                    height: 120,
                    backgroundColor: cat.soft,
                    opacity: locked ? 0.5 : 1,
                    borderWidth: photo ? 0 : 2,
                    borderStyle: 'dashed',
                    borderColor: `${cat.accent}66`,
                  }}
                >
                  {photo ? (
                    <>
                      <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} />
                      <Pressable
                        onPress={() => removePhoto(slot)}
                        hitSlop={8}
                        className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-white/90"
                      >
                        <X size={13} color={brand.ink} />
                      </Pressable>
                    </>
                  ) : slot === 0 ? (
                    <View className="items-center gap-1 px-2">
                      <Text className="text-3xl">{defaults?.emoji}</Text>
                      <View className="mt-1 flex-row items-center gap-1">
                        <Camera size={13} color={cat.accent} />
                        <Text className="text-xs font-semibold" style={{ color: cat.accent }}>
                          Add photo
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="items-center gap-1">
                      <Plus size={20} color={brand.inkSoft} />
                      <Text className="text-xs font-semibold text-ink-soft">Optional 2nd</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text className="mb-2 text-sm font-bold text-ink">Priority</Text>
          <View className="flex-row gap-2">
            {PRIORITIES.map((p) => {
              const active = priority === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPriority(p.id)}
                  className="flex-1 items-center rounded-xl py-2.5 active:opacity-80"
                  style={{
                    backgroundColor: active ? p.color : '#fff',
                    borderWidth: 1,
                    borderColor: p.color,
                  }}
                >
                  <Text className="text-sm font-bold" style={{ color: active ? '#fff' : p.color }}>
                    {p.id}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {categoryId === 'blood' && (
          <View>
            <Text className="mb-2 text-sm font-bold text-ink">Blood group needed</Text>
            <View className="flex-row flex-wrap gap-2">
              {BLOOD_GROUPS.map((bg) => {
                const active = bloodGroup === bg;
                return (
                  <Pressable
                    key={bg}
                    onPress={() => setBloodGroup(bg)}
                    className="items-center rounded-lg py-2.5 active:opacity-80"
                    style={{
                      width: '23.5%',
                      backgroundColor: active ? brand.clay : brand.claySoft,
                    }}
                  >
                    <Text
                      className="text-sm font-bold"
                      style={{ color: active ? '#fff' : brand.clay }}
                    >
                      {bg}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View>
          <Text className="mb-2 text-sm font-bold text-ink">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholder="What's the situation?"
            placeholderTextColor={brand.inkSoft}
            className="min-h-[88px] rounded-xl border border-line bg-white p-3 text-sm text-ink"
          />
        </View>

        <View className="flex-row items-center gap-2 rounded-xl border border-line bg-white p-3">
          <MapPin size={15} color={lastCoords ? brand.leaf : brand.inkSoft} />
          <Text className="text-sm text-ink-soft">
            {lastCoords
              ? 'Location auto-captured'
              : 'Location not available yet — volunteers will see your last known area'}
          </Text>
        </View>
      </ScrollView>

      <View className="border-t border-line p-3">
        <Pressable
          disabled={!canSend}
          onPress={submit}
          className="items-center rounded-xl py-3.5 active:opacity-80"
          style={{ backgroundColor: cat.accent, opacity: canSend ? 1 : 0.4 }}
        >
          <Text className="text-base font-bold text-white">Send Request</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
