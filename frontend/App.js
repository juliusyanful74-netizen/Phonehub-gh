import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';

const SAMPLE_LISTINGS = [
  {
    id: '1',
    title: 'iPhone 14 Pro',
    price: '$780',
    location: 'Accra',
    condition: 'Good',
  },
  {
    id: '2',
    title: 'Samsung Galaxy S23',
    price: '$620',
    location: 'Kumasi',
    condition: 'Excellent',
  },
  {
    id: '3',
    title: 'Google Pixel 8',
    price: '$540',
    location: 'Takoradi',
    condition: 'Like New',
  },
];

export default function App() {
  const [listings, setListings] = useState(SAMPLE_LISTINGS);

  useEffect(() => {
    // This is a placeholder for API loading in the next step
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}> 
        <Text style={styles.appName}>PhoneHub</Text>
        <TouchableOpacity style={styles.sellButton}>
          <Text style={styles.sellButtonText}>Sell</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Buy & sell phones easily</Text>
        <Text style={styles.heroSubtitle}>Discover verified devices near you.</Text>
      </View>

      <Text style={styles.sectionTitle}>Featured phones</Text>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.phoneTitle}>{item.title}</Text>
            <Text style={styles.phoneMeta}>{item.location}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.price}>{item.price}</Text>
              <Text style={styles.condition}>{item.condition}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#101828',
  },
  sellButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
  },
  sellButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
  },
  heroTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  phoneTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  phoneMeta: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  condition: {
    fontSize: 12,
    color: '#475569',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
