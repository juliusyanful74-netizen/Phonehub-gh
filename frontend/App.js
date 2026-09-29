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

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';

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

const emptyAuthForm = {
  name: '',
  email: '',
  password: '',
};

const BRANDS = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus', 'Motorola', 'Nokia', 'Sony'];
const CONDITIONS = ['Like New', 'Good', 'Fair', 'Used'];
const LOCATIONS = ['Accra', 'Kumasi', 'Takoradi', 'Tema', 'Cape Coast', 'Sekondi', 'Osino', 'Obuasi'];

const PRICE_FILTERS = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Under GHS 200', min: 0, max: 200 },
  { label: 'GHS 200 - 500', min: 200, max: 500 },
  { label: 'GHS 500 - 1000', min: 500, max: 1000 },
  { label: 'Above GHS 1000', min: 1000, max: Infinity },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('browse');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPriceFilter, setSelectedPriceFilter] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [currentUser, setCurrentUser] = useState(null);

  const filteredListings = useMemo(() => {
    let result = listings;

    if (searchText.trim()) {
      const query = searchText.trim().toLowerCase();
      result = result.filter((item) =>
        [item.title, item.brand, item.model, item.seller_name, item.location]
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    if (selectedBrand) {
      result = result.filter((item) => item.brand === selectedBrand);
    }

    if (selectedCondition) {
      result = result.filter((item) => item.condition === selectedCondition);
    }

    if (selectedLocation) {
      result = result.filter((item) => item.location === selectedLocation);
    }

    const priceRange = PRICE_FILTERS[selectedPriceFilter];
    result = result.filter((item) => item.price >= priceRange.min && item.price <= priceRange.max);

    return result;
  }, [listings, searchText, selectedBrand, selectedCondition, selectedLocation, selectedPriceFilter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBrand) count++;
    if (selectedCondition) count++;
    if (selectedLocation) count++;
    if (selectedPriceFilter !== 0) count++;
    return count;
  }, [selectedBrand, selectedCondition, selectedLocation, selectedPriceFilter]);

  const totalValue = useMemo(() => {
    return listings.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [listings]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/phones`);
      if (!response.ok) throw new Error('Unable to load listings');
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

  const handleAuthInputChange = (key, value) => {
    setAuthForm((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSelectedBrand(null);
    setSelectedCondition(null);
    setSelectedLocation(null);
    setSelectedPriceFilter(0);
    setSearchText('');
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

  const handleAuthSubmit = async () => {
    if (!authForm.email || !authForm.password || (authMode === 'register' && !authForm.name)) {
      Alert.alert('Missing fields', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = authMode === 'register' ? '/users/register' : '/users/login';
      const payload = authMode === 'register'
        ? { name: authForm.name, email: authForm.email, password: authForm.password }
        : { email: authForm.email, password: authForm.password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      setCurrentUser({ ...data, email: data.email || authForm.email });
      setAuthForm(emptyAuthForm);
      setActiveTab('browse');
      Alert.alert('Success', authMode === 'register' ? 'Your account is ready' : 'Welcome back');
    } catch (error) {
      Alert.alert('Authentication error', error.message || 'Unable to authenticate');
    } finally {
      setSubmitting(false);
    }
  };

  const renderListingCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedListing(item)}>
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
    </TouchableOpacity>
  );

  if (selectedListing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedListing(null)}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selectedListing.title}</Text>
          <Text style={styles.detailPrice}>GHS {Number(selectedListing.price).toFixed(2)}</Text>
          <Text style={styles.detailMeta}>{selectedListing.brand} • {selectedListing.model}</Text>
          <Text style={styles.detailMeta}>Location: {selectedListing.location}</Text>
          <Text style={styles.detailMeta}>Seller: {selectedListing.seller_name}</Text>
          <Text style={styles.detailMeta}>Condition: {selectedListing.condition}</Text>

          <View style={styles.detailDescriptionBox}>
            <Text style={styles.detailDescriptionTitle}>Description</Text>
            <Text style={styles.detailDescription}>
              {selectedListing.description || 'No description provided by the seller.'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => {
              if (!currentUser) {
                Alert.alert('Sign in required', 'Please log in before contacting a seller.');
                return;
              }
              Alert.alert('Message seller', `Hi ${selectedListing.seller_name}, I am interested in ${selectedListing.title}.`);
            }}
          >
            <Text style={styles.contactButtonText}>Message seller</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'browse' && styles.tabButtonActive]}
          onPress={() => setActiveTab('browse')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'browse' && styles.tabButtonTextActive]}>Browse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'account' && styles.tabButtonActive]}
          onPress={() => setActiveTab('account')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'account' && styles.tabButtonTextActive]}>
            {currentUser ? 'Account' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'account' ? (
        currentUser ? (
          <View style={styles.accountCard}>
            <Text style={styles.accountGreeting}>Welcome back</Text>
            <Text style={styles.accountName}>{currentUser.name}</Text>
            <Text style={styles.accountEmail}>{currentUser.email}</Text>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                setCurrentUser(null);
                setActiveTab('browse');
              }}
            >
              <Text style={styles.logoutButtonText}>Log out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.formCard}>
              <View style={styles.switchRow}>
                <TouchableOpacity
                  style={[styles.switchButton, authMode === 'login' && styles.switchButtonActive]}
                  onPress={() => setAuthMode('login')}
                >
                  <Text style={[styles.switchButtonText, authMode === 'login' && styles.switchButtonTextActive]}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.switchButton, authMode === 'register' && styles.switchButtonActive]}
                  onPress={() => setAuthMode('register')}
                >
                  <Text style={[styles.switchButtonText, authMode === 'register' && styles.switchButtonTextActive]}>Register</Text>
                </TouchableOpacity>
              </View>

              {authMode === 'register' && (
                <TextInput
                  value={authForm.name}
                  onChangeText={(value) => handleAuthInputChange('name', value)}
                  placeholder="Full name"
                  style={styles.input}
                />
              )}

              <TextInput
                value={authForm.email}
                onChangeText={(value) => handleAuthInputChange('email', value)}
                placeholder="Email"
                keyboardType="email-address"
                style={styles.input}
              />

              <TextInput
                value={authForm.password}
                onChangeText={(value) => handleAuthInputChange('password', value)}
                placeholder="Password"
                secureTextEntry
                style={styles.input}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleAuthSubmit} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{authMode === 'register' ? 'Create account' : 'Log in'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )
      ) : (
        <>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search phones, brands..."
            style={styles.searchInput}
          />

          <View style={styles.filterHeaderRow}>
            <TouchableOpacity style={styles.filterToggleButton} onPress={() => setShowFilters((prev) => !prev)}>
              <Text style={styles.filterToggleText}>🔍 Filters</Text>
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

          {showFilters && (
            <View style={styles.filtersPanel}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Brand</Text>
                <View style={styles.filterOptionsRow}>
                  {BRANDS.map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={[styles.filterOption, selectedBrand === brand && styles.filterOptionActive]}
                      onPress={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                    >
                      <Text style={[styles.filterOptionText, selectedBrand === brand && styles.filterOptionTextActive]}>{brand}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Condition</Text>
                <View style={styles.filterOptionsRow}>
                  {CONDITIONS.map((condition) => (
                    <TouchableOpacity
                      key={condition}
                      style={[styles.filterOption, selectedCondition === condition && styles.filterOptionActive]}
                      onPress={() => setSelectedCondition(selectedCondition === condition ? null : condition)}
                    >
                      <Text style={[styles.filterOptionText, selectedCondition === condition && styles.filterOptionTextActive]}>{condition}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                <View style={styles.filterOptionsRow}>
                  {LOCATIONS.map((location) => (
                    <TouchableOpacity
                      key={location}
                      style={[styles.filterOption, selectedLocation === location && styles.filterOptionActive]}
                      onPress={() => setSelectedLocation(selectedLocation === location ? null : location)}
                    >
                      <Text style={[styles.filterOptionText, selectedLocation === location && styles.filterOptionTextActive]}>{location}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range</Text>
                <View style={styles.filterOptionsCol}>
                  {PRICE_FILTERS.map((priceRange, index) => (
                    <TouchableOpacity
                      key={priceRange.label}
                      style={[styles.filterOptionWide, selectedPriceFilter === index && styles.filterOptionActive]}
                      onPress={() => setSelectedPriceFilter(index)}
                    >
                      <Text style={[styles.filterOptionText, selectedPriceFilter === index && styles.filterOptionTextActive]}>{priceRange.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

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

          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Featured phones</Text>
            <Text style={styles.resultCount}>{filteredListings.length} results</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1d4ed8" />
            </View>
          ) : filteredListings.length > 0 ? (
            <FlatList
              data={filteredListings}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderListingCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>📱</Text>
              <Text style={styles.emptyStateTitle}>No phones found</Text>
              <Text style={styles.emptyStateText}>Try adjusting your filters or search term</Text>
            </View>
          )}
        </>
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
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#fff',
  },
  tabButtonText: {
    fontWeight: '700',
    color: '#475569',
  },
  tabButtonTextActive: {
    color: '#0f172a',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderColor: '#dfe7f3',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: '#0f172a',
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterToggleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderColor: '#dfe7f3',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 6,
  },
  filterToggleText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  filterBadge: {
    backgroundColor: '#1d4ed8',
    borderRadius: 999,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  clearFiltersText: {
    color: '#ef4444',
    fontWeight: '700',
  },
  filtersPanel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionsCol: {
    gap: 8,
  },
  filterOption: {
    backgroundColor: '#f8fafc',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterOptionActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  filterOptionText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  filterOptionWide: {
    backgroundColor: '#f8fafc',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  switchRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#fff',
  },
  switchButtonText: {
    fontWeight: '700',
    color: '#475569',
  },
  switchButtonTextActive: {
    color: '#0f172a',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a',
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  accountGreeting: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  accountName: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '800',
  },
  accountEmail: {
    color: '#475569',
    fontSize: 16,
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  resultCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
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
    fontSize: 18,
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 18,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  backButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  detailPrice: {
    fontSize: 24,
    color: '#16a34a',
    fontWeight: '800',
    marginBottom: 10,
  },
  detailMeta: {
    color: '#475569',
    fontSize: 15,
    marginBottom: 6,
  },
  detailDescriptionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  detailDescriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  detailDescription: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
  contactButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 18,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
