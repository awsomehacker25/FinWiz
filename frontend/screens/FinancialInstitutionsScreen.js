import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';

export default function FinancialInstitutionsScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  useEffect(() => {
    getLocationAndInstitutions();
  }, []);

  const getLocationAndInstitutions = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearby financial institutions.');
        setLoading(false);
        return;
      }

      // Get current location
      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation.coords);

      // Fetch nearby financial institutions
      await fetchInstitutions(userLocation.coords.latitude, userLocation.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      setLoading(false);
    }
  };

  const fetchInstitutions = async (lat, lon) => {
    try {
      // Overpass API query for financial institutions
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="bank"](around:5000,${lat},${lon});
          node["amenity"="atm"](around:5000,${lat},${lon});
          node["office"="financial"](around:5000,${lat},${lon});
          node["amenity"="credit_union"](around:5000,${lat},${lon});
          node["office"="tax_advisor"](around:5000,${lat},${lon});
          node["office"="accountant"](around:5000,${lat},${lon});
          node["office"="financial_advisor"](around:5000,${lat},${lon});
          node["office"="insurance"](around:5000,${lat},${lon});
          node["office"="lawyer"](around:5000,${lat},${lon});
          node["office"="estate_agent"](around:5000,${lat},${lon});
          node["office"="investment"](around:5000,${lat},${lon});
          node["amenity"="post_office"](around:5000,${lat},${lon});
        );
        out body;
      `;

      const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
        headers: { 'Content-Type': 'text/plain' }
      });

      const institutionsData = response.data.elements
        .filter(element => element.tags?.name && element.tags.name.trim() !== '')
        .map(element => ({
          id: element.id,
          name: element.tags.name,
          type: element.tags?.amenity || element.tags?.office || 'financial',
          lat: element.lat,
          lon: element.lon,
          address: element.tags?.['addr:full'] || `${element.tags?.['addr:street'] || ''} ${element.tags?.['addr:housenumber'] || ''}`.trim(),
          phone: element.tags?.phone || element.tags?.['contact:phone'],
          website: element.tags?.website || element.tags?.['contact:website'],
          opening_hours: element.tags?.opening_hours
        }));

      console.log('Fetched Institutions:', institutionsData);

      setInstitutions(institutionsData);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      Alert.alert('Error', 'Unable to fetch financial institutions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInstitutionIcon = (type) => {
    switch (type) {
      case 'bank':
        return 'account-balance';
      case 'atm':
        return 'atm';
      case 'credit_union':
        return 'business';
      case 'tax_advisor':
        return 'calculate';
      case 'accountant':
        return 'calculate';
      case 'financial_advisor':
        return 'trending-up';
      case 'insurance':
        return 'security';
      case 'lawyer':
        return 'gavel';
      case 'estate_agent':
        return 'home';
      case 'investment':
        return 'trending-up';
      case 'post_office':
        return 'local-post-office';
      default:
        return 'location-on';
    }
  };

  const getInstitutionColor = (type) => {
    switch (type) {
      case 'bank':
        return '#4CAF50';
      case 'atm':
        return '#FF9800';
      case 'credit_union':
        return '#2196F3';
      case 'tax_advisor':
        return '#9C27B0';
      case 'accountant':
        return '#9C27B0';
      case 'financial_advisor':
        return '#FF5722';
      case 'insurance':
        return '#607D8B';
      case 'lawyer':
        return '#795548';
      case 'estate_agent':
        return '#3F51B5';
      case 'investment':
        return '#FF5722';
      case 'post_office':
        return '#8BC34A';
      default:
        return '#9C27B0';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Finding nearby financial institutions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      {location && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {institutions.map((institution) => (
              <Marker
                key={institution.id}
                coordinate={{
                  latitude: institution.lat,
                  longitude: institution.lon,
                }}
                title={institution.name}
                description={institution.address}
                onPress={() => setSelectedInstitution(institution)}
              >
                <View style={[styles.markerContainer, { backgroundColor: getInstitutionColor(institution.type) }]}>
                  <MaterialIcons
                    name={getInstitutionIcon(institution.type)}
                    size={16}
                    color="#ffffff"
                  />
                </View>
              </Marker>
            ))}
          </MapView>
        </View>
      )}

      {/* Institutions List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Nearby Institutions ({institutions.length})</Text>
        <ScrollView style={styles.scrollView}>
          {institutions.map((institution) => (
            <TouchableOpacity
              key={institution.id}
              style={[
                styles.institutionCard,
                selectedInstitution?.id === institution.id && styles.selectedCard
              ]}
              onPress={() => setSelectedInstitution(institution)}
            >
              <View style={styles.institutionIcon}>
                <MaterialIcons
                  name={getInstitutionIcon(institution.type)}
                  size={24}
                  color={getInstitutionColor(institution.type)}
                />
              </View>
              <View style={styles.institutionInfo}>
                <Text style={styles.institutionName}>{institution.name}</Text>
                <Text style={styles.institutionType}>
                  {institution.type.replace('_', ' ').toUpperCase()}
                </Text>
                {institution.address && (
                  <Text style={styles.institutionAddress}>{institution.address}</Text>
                )}
                {institution.phone && (
                  <Text style={styles.institutionPhone}>{institution.phone}</Text>
                )}
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#B0BEC5" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Institution Details Modal */}
      {selectedInstitution && (
        <View style={styles.detailsModal}>
          <View style={styles.detailsContent}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>{selectedInstitution.name}</Text>
              <TouchableOpacity
                onPress={() => setSelectedInstitution(null)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsBody}>
              <View style={styles.detailRow}>
                <MaterialIcons name="location-on" size={20} color="#B0BEC5" />
                <Text style={styles.detailText}>
                  {selectedInstitution.address || 'Address not available'}
                </Text>
              </View>

              {selectedInstitution.phone && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="phone" size={20} color="#B0BEC5" />
                  <Text style={styles.detailText}>{selectedInstitution.phone}</Text>
                </View>
              )}

              {selectedInstitution.website && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="web" size={20} color="#B0BEC5" />
                  <Text style={styles.detailText}>{selectedInstitution.website}</Text>
                </View>
              )}

              {selectedInstitution.opening_hours && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="schedule" size={20} color="#B0BEC5" />
                  <Text style={styles.detailText}>{selectedInstitution.opening_hours}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17384a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#17384a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#17384a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f2a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  mapContainer: {
    height: 400,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#0f2a3a',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  institutionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17384a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  institutionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f2a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  institutionInfo: {
    flex: 1,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  institutionType: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 4,
  },
  institutionAddress: {
    fontSize: 14,
    color: '#cfe0ee',
    marginBottom: 2,
  },
  institutionPhone: {
    fontSize: 14,
    color: '#cfe0ee',
  },
  detailsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContent: {
    backgroundColor: '#0f2a3a',
    borderRadius: 12,
    margin: 24,
    padding: 24,
    width: '90%',
    maxHeight: '70%',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#17384a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBody: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailText: {
    fontSize: 16,
    color: '#cfe0ee',
    marginLeft: 12,
    flex: 1,
  },
});