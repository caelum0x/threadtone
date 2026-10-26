import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { nameColor } from '../../lib/colorTheory';
import { PRESET_COLORS } from '../../lib/colorPalette';
import { detectDominantColor } from '../../lib/detectColor';
import { persistItemPhoto } from '../../lib/photoStorage';
import type { ClothingCategory, Formality, Pattern } from '../../lib/types';
import { CLOTHING_CATEGORIES, FORMALITY_LEVELS, PATTERNS } from '../../lib/types';
import { createItem } from '../../repo/items';
import { color, radius, space, type as textType } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { ColorDot } from '../../ui/ColorDot';
import { CameraIcon, CheckIcon, CloseIcon } from '../../ui/icons';

const CATEGORY_LABEL: Record<ClothingCategory, string> = {
  top: 'Top',
  bottom: 'Bottom',
  dress: 'Dress',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessory',
};

const PATTERN_LABEL: Record<Pattern, string> = {
  solid: 'Solid',
  striped: 'Striped',
  plaid: 'Plaid',
  floral: 'Floral',
  graphic: 'Graphic',
  textured: 'Textured',
};

const FORMALITY_LABEL: Record<Formality, string> = {
  casual: 'Casual',
  'smart-casual': 'Smart-casual',
  formal: 'Formal',
};

export default function NewItemScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectedHex, setDetectedHex] = useState<string | null>(null);
  const [category, setCategory] = useState<ClothingCategory>('top');
  const [name, setName] = useState('');
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [pattern, setPattern] = useState<Pattern>('solid');
  const [formality, setFormality] = useState<Formality>('casual');
  const [saving, setSaving] = useState(false);

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo library permission needed', 'Allow photo access to add a picture of this item.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    await handleNewPhoto(result.assets[0].uri);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to photograph this item.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    await handleNewPhoto(result.assets[0].uri);
  }

  async function handleNewPhoto(uri: string) {
    setPhotoUri(uri);
    setDetecting(true);
    const detected = await detectDominantColor(uri);
    setDetecting(false);
    if (detected) {
      setDetectedHex(detected);
      setSelectedHex(detected);
    }
  }

  function handleAddPhoto() {
    Alert.alert('Add a photo', undefined, [
      { text: 'Take Photo', onPress: () => void takePhoto() },
      { text: 'Choose from Library', onPress: () => void pickFromLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleSave() {
    if (name.trim().length === 0) {
      Alert.alert('Name this item', 'Give it a short name, like "Gray wool sweater".');
      return;
    }
    if (!selectedHex) {
      Alert.alert('Pick a color', 'Choose the closest swatch for this item.');
      return;
    }

    setSaving(true);
    try {
      let storedPhotoUri: string | null = null;
      if (photoUri) {
        storedPhotoUri = await persistItemPhoto(photoUri);
      }
      await createItem({
        category,
        name: name.trim(),
        colorHex: selectedHex,
        colorName: nameColor(selectedHex),
        pattern,
        formality,
        photoUri: storedPhotoUri,
        favorite: false,
      });
      router.back();
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Could not save this item.';
      Alert.alert('Something went wrong', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={() => router.back()} hitSlop={12}>
          <CloseIcon color={color.text2} />
        </Pressable>
        <Text style={textType.heading}>New item</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.photoBox} onPress={handleAddPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <CameraIcon size={28} color={color.text3} />
              <Text style={[textType.caption, { color: color.text3, marginTop: space.xs }]}>Add a photo</Text>
            </View>
          )}
        </Pressable>

        <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>CATEGORY</Text>
        <View style={styles.chipRow}>
          {CLOTHING_CATEGORIES.map((c) => (
            <Chip key={c} label={CATEGORY_LABEL[c]} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={`e.g. ${CATEGORY_LABEL[category]} name`}
          placeholderTextColor={color.text3}
          style={styles.input}
        />

        <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>COLOR</Text>
        {detecting ? (
          <View style={styles.detectingRow}>
            <ActivityIndicator color={color.text2} size="small" />
            <Text style={[textType.caption, { color: color.text3 }]}>Detecting dominant color…</Text>
          </View>
        ) : null}
        {detectedHex ? (
          <Pressable style={styles.detectedRow} onPress={() => setSelectedHex(detectedHex)}>
            <ColorDot hex={detectedHex} size={20} />
            <Text style={[textType.caption, { color: color.text2 }]}>
              Detected from photo: {nameColor(detectedHex)} {selectedHex === detectedHex ? '(selected)' : ''}
            </Text>
          </Pressable>
        ) : null}
        <View style={styles.swatchGrid}>
          {PRESET_COLORS.map((preset) => (
            <Pressable
              key={preset.hex}
              onPress={() => setSelectedHex(preset.hex)}
              style={[styles.swatchCell, selectedHex === preset.hex && styles.swatchCellSelected]}
            >
              <ColorDot hex={preset.hex} size={28} />
            </Pressable>
          ))}
        </View>
        {selectedHex ? (
          <Text style={[textType.caption, { color: color.text2, marginTop: space.xs }]}>
            Selected: {nameColor(selectedHex)}
          </Text>
        ) : null}

        <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>PATTERN</Text>
        <View style={styles.chipRow}>
          {PATTERNS.map((p) => (
            <Chip key={p} label={PATTERN_LABEL[p]} selected={pattern === p} onPress={() => setPattern(p)} />
          ))}
        </View>

        <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>FORMALITY</Text>
        <View style={styles.chipRow}>
          {FORMALITY_LEVELS.map((f) => (
            <Chip key={f} label={FORMALITY_LABEL[f]} selected={formality === f} onPress={() => setFormality(f)} />
          ))}
        </View>

        <Button
          icon={(c) => <CheckIcon color={c} />}
          accessibilityLabel="Save item"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: space.xxl }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  content: {
    padding: space.lg,
    paddingBottom: space.xxl,
  },
  photoBox: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    overflow: 'hidden',
    backgroundColor: color.surface1,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.sm,
  },
  input: {
    marginTop: space.sm,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: color.text1,
    fontSize: 16,
  },
  detectingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.sm,
  },
  detectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.sm,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space.sm,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
  },
  swatchCell: {
    padding: 4,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchCellSelected: {
    borderColor: color.accent,
  },
});
