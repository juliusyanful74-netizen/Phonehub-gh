import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL = 'http://127.0.0.1:8000';

const emptyForm = {
  title: '',
  brand: '',
  model: '',
  price: '',
  condition: 'Good',
  seller_name: '',
  description: '',
  location: '',
};

export default function App() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const totalValue = useMemo(() => {
    return listings.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [listings]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/phones`);
      if (!response.ok) {
        throw new Error('Unable to load listings');
      }
      const data = await response.json();
      setListings(data);
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitListing = async () => {
    if (!form.title || !form.brand || !form.model || !form.price || !form.seller_name) {
      Alert.alert('Complete the form', 'Please fill in the required fields');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title,
        brand: form.brand,
        model: form.model,
        price: Number(form.price),
        condition: form.condition,
        seller_name: form.seller_name,
        description: form.description,
        location: form.location || 'Unknown',
      };

      const response = await fetch(`${API_URL}/phones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Could not create listing');
      }

      await fetchListings();
      setForm(emptyForm);
      setShowForm(false);
      Alert.alert('Success', 'Your phone listing has been posted');
    } catch (error) {
      Alert.alert('Error', error.message || 'Unable to post listing');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.phoneTitle}>{item.title}</Text>
        <Text style={styles.price}>GHS {Number(item.price).toFixed(2)}</Text>
      </View>

      <Text style={styles.metaText}>{item.brand} • {item.model}</Text>
      <Text style={styles.metaText}>{item.location}</Text>

      <View style={styles.cardBottomRow}>
        <Text style={styles.conditionBadge}>{item.condition}</Text>
        <Text style={styles.sellerText}>By {item.seller_name}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Marketplace</Text>
          <Text style={styles.appName}>PhoneHub</Text>
        </View>

        <TouchableOpacity style={styles.sellButton} onPress={() => setShowForm((prev) => !prev)}>
          <Text style={styles.sellButtonText}>{showForm ? 'Close' : 'Sell'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Listings</Text>
          <Text style={styles.summaryValue}>{listings.length}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Inventory</Text>
          <Text style={styles.summaryValue}>GHS {totalValue.toFixed(2)}</Text>
        </View>
      </View>

      {showForm && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Post a phone</Text>

            <TextInput
              value={form.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder="Phone title"
              style={styles.input}
            />

            <View style={styles.inlineRow}>
              <TextInput
                value={form.brand}
                onChangeText={(value) => handleInputChange('brand', value)}
                placeholder="Brand"
                style={[styles.input, styles.inlineInput]}
              />

              <TextInput
                value={form.model}
                onChangeText={(value) => handleInputChange('model', value)}
                placeholder="Model"
                style={[styles.input, styles.inlineInput]}
              />
            </View>

            <View style={styles.inlineRow}>
              <TextInput
                value={form.price}
                onChangeText={(value) => handleInputChange('price', value)}
                placeholder="Price"
                keyboardType="numeric"
                style={[styles.input, styles.inlineInput]}
              />

              <TextInput
                value={form.condition}
                onChangeText={(value) => handleInputChange('condition', value)}
                placeholder="Condition"
                style={[styles.input, styles.inlineInput]}
              />
            </View>

            <TextInput
              value={form.seller_name}
              onChangeText={(value) => handleInputChange('seller_name', value)}
              placeholder="Seller name"
              style={styles.input}
            />

            <TextInput
              value={form.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="Location"
              style={styles.input}
            />

            <TextInput
              value={form.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Short description"
              multiline
              style={[styles.input, styles.textArea]}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitListing} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Publish listing</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      <Text style={styles.sectionTitle}>Featured phones</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  kicker: {
    fontSize: 12,
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
  },
  sellButton: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  sellButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 10,
  },
  summaryValue: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    color: '#0f172a',
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inlineInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  phoneTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  price: {
    fontSize: 18,
    color: '#16a34a',
    fontWeight: '800',
    marginLeft: 10,
  },
  metaText: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 4,
  },
  cardBottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conditionBadge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  sellerText: {
    color: '#475569',
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
