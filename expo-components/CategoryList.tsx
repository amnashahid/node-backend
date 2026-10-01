import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Set to your backend URL (use your machine's LAN IP on a real device)
const BASE_URL = "http://192.168.1.100:5000";

export interface Category {
  _id: string;
  nameEn: string;
  nameUr: string;
  image: string | null;
  parentCategoryId: { _id: string } | string | null;
  isActive: boolean;
  sortOrder: number;
}

interface Props {
  token?: string;
  language?: "en" | "ur";
  onPress?: (category: Category) => void;
}

export default function CategoryList({ token, language = "en", onPress }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/categories`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load categories");
        }
        const main = (json.data as Category[])
          .filter((c) => !c.parentCategoryId && c.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (active) setCategories(main);
      } catch (e: any) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) return <ActivityIndicator style={styles.center} />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <FlatList
      data={categories}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => onPress?.(item)}>
          {item.image ? (
            <Image source={{ uri: `${BASE_URL}${item.image}` }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]} />
          )}
          <Text style={styles.name} numberOfLines={1}>
            {language === "ur" ? item.nameUr : item.nameEn}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { padding: 16 },
  error: { color: "red", padding: 16 },
  list: { paddingHorizontal: 12 },
  item: { alignItems: "center", marginRight: 16, width: 72 },
  image: { width: 64, height: 64, borderRadius: 32 },
  placeholder: { backgroundColor: "#e5e5e5" },
  name: { marginTop: 6, fontSize: 12, textAlign: "center" },
});
