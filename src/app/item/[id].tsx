import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { nameColor } from '../../lib/colorTheory';
import { PRESET_COLORS } from '../../lib/colorPalette';
import { deleteItemPhoto, persistItemPhoto } from '../../lib/photoStorage';
import { parsePriceInput } from '../../lib/price';
import type { ClothingCategory, ClothingItem, Formality, Pattern } from '../../lib/types';
import { CLOTHING_CATEGORIES, FORMALITY_LEVELS, PATTERNS } from '../../lib/types';
import { getCurrencySymbol } from '../../repo/appMeta';
import { deleteItem, getItem, toggleItemFavorite, updateItem } from '../../repo/items';
import { color, radius, space, type as textType } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { ColorDot } from '../../ui/ColorDot';
import { CameraIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, LayersIcon, StarIcon, TrashIcon } from '../../ui/icons';

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

export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState<ClothingItem | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [category, setCategory] = useState<ClothingCategory>('top');
  const [name, setName] = useState('');
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [pattern, setPattern] = useState<Pattern>('solid');
  const [formality, setFormality] = useState<Formality>('casual');
  const [favorite, setFavorite] = useState(false);
  const [priceText, setPriceText] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      const [item, symbol] = await Promise.all([getItem(id), getCurrencySymbol()]);
      if (cancelled || !item) return;
      setOriginal(item);
      setPhotoUri(item.photoUri);
      setCategory(item.category);
      setName(item.name);
      setSelectedHex(item.colorHex);
      setPattern(item.pattern);
      setFormality(item.formality);
      setFavorite(item.favorite);
      setPriceText(item.purchasePrice !== null ? String(item.purchasePrice) : '');
      setCurrencySymbol(symbol);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleReplacePhoto() {
    Alert.alert('Replace photo', undefined, [
      {
        text: 'Take Photo',
        onPress: () => {
          void (async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) return;
            const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
            if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
          })();
        },
      },
      {
        text: 'Choose from Library',
        onPress: () => {
          void (async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) return;
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
            if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
          })();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleToggleFavorite() {
    if (!original) return;
    const next = !favorite;
    setFavorite(next);
    await toggleItemFavorite(original.id, next);
  }

  async function handleSave() {
    if (!original) return;
    if (name.trim().length === 0) {
      Alert.alert('Name this item', 'Give it a short name.');
      return;
    }
    if (!selectedHex) {
      Alert.alert('Pick a color', 'Choose the closest swatch for this item.');
      return;
    }

    setSaving(true);
    try {
      let storedPhotoUri = original.photoUri;
      // Only remember the old photo for cleanup here — don't delete it yet.
      // Deleting it before `updateItem` below is confirmed to succeed would,
      // if that write throws (a real failure mode: SQLite "database is
      // locked"/disk-full, not hypothetical — this exact app's own session
      // history documents both happening on this device), leave the item's
      // DB row still pointing at a photo file that's already gone, with no
      // way to recover it short of replacing the photo again.
      let previousPhotoUri: string | null = null;
      if (photoUri && photoUri !== original.photoUri) {
        storedPhotoUri = await persistItemPhoto(photoUri);
        previousPhotoUri = original.photoUri;
      }
      const parsedPrice = parsePriceInput(priceText);
      await updateItem(original.id, {
        category,
        name: name.trim(),
        colorHex: selectedHex,
        colorName: nameColor(selectedHex),
        pattern,
        formality,
        photoUri: storedPhotoUri,
        favorite,
        archived: original.archived,
        purchasePrice: priceText.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null,
      });
      // The DB row now safely points at the new photo — only now is it safe
      // to delete the old one.
      if (previousPhotoUri) deleteItemPhoto(previousPhotoUri);
      router.back();
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Could not update this item.';
      Alert.alert('Something went wrong', message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!original) return;
    Alert.alert('Delete this item?', 'This also removes it from any saved outfits.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteItem(original.id);
            deleteItemPhoto(original.photoUri);
            router.back();
          })();
        },
      },
    ]);
  }

  if (loading || !original) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={color.text1} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
          <ChevronLeftIcon color={color.text1} />
        </Pressable>
        <Text style={textType.heading}>Edit item</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={favorite ? "Remove from favorites" : "Add to favorites"} onPress={handleToggleFavorite} hitSlop={12}>
          <StarIcon color={color.accent} filled={favorite} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.photoBox} onPress={handleReplacePhoto}>
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
        <TextInput value={name} onChangeText={setName} placeholderTextColor={color.text3} style={styles.input} />

        <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>COLOR</Text>
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

        <Text style={[textType.label, { color: color.text3, marginTop: space.xl }]}>PRICE PAID (OPTIONAL)</Text>
        <View style={styles.priceRow}>
          <Text style={[textType.bodyMedium, { color: color.text2 }]}>{currencySymbol}</Text>
          <TextInput
            value={priceText}
            onChangeText={setPriceText}
            placeholder="0.00"
            placeholderTextColor={color.text3}
            keyboardType="decimal-pad"
            style={styles.priceInput}
          />
        </View>

        <Pressable
          style={styles.historyRow}
          onPress={() => router.push(`/item/history/${original.id}`)}
          accessibilityRole="button"
          accessibilityLabel="View wear history"
        >
          <LayersIcon size={18} color={color.text2} />
          <Text style={[textType.body, { color: color.text1, flex: 1, marginLeft: space.xs }]}>Wear history</Text>
          <ChevronRightIcon size={18} color={color.text3} />
        </Pressable>

        <Button
          icon={(c) => <CheckIcon color={c} />}
          accessibilityLabel="Save changes"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: space.xxl }}
        />
        <Button
          icon={(c) => <TrashIcon color={c} />}
          accessibilityLabel="Delete item"
          variant="danger"
          onPress={handleDelete}
          style={{ marginTop: space.sm }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
  },
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.sm,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  priceInput: {
    flex: 1,
    paddingVertical: space.sm,
    color: color.text1,
    fontSize: 16,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.lg,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
});
