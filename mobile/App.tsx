import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/supabaseClient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Lock, KeyRound, UploadCloud, File as FileIcon, Trash2 } from 'lucide-react-native';

export default function App() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const savedPin = await AsyncStorage.getItem('omnidrop_pin');
    if (savedPin) {
      setPin(savedPin);
      setIsAuthenticated(true);
      fetchFiles(savedPin);
    }
  };

  const fetchFiles = async (currentPin: string) => {
    try {
      const { data, error } = await supabase.storage.from('sync_files').list(currentPin);
      if (error) throw error;
      const validFiles = data?.filter(f => f.name !== '.emptyFolderPlaceholder' && f.name !== 'clipboard.txt') || [];
      
      const filesWithUrls = await Promise.all(validFiles.map(async (f) => {
        const { data: urlData } = supabase.storage.from('sync_files').getPublicUrl(`${currentPin}/${f.name}`);
        return { 
          ...f, 
          url: urlData.publicUrl,
        };
      }));
      setFiles(filesWithUrls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      console.log(e);
    }
  };

  const handleLogin = async () => {
    if (pin.length === 4) {
      await AsyncStorage.setItem('omnidrop_pin', pin);
      setIsAuthenticated(true);
      fetchFiles(pin);
    } else {
      Alert.alert('Error', 'PIN must be 4 digits');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('omnidrop_pin');
    setIsAuthenticated(false);
    setPin('');
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled || !result.assets[0]) return;
      
      setUploading(true);
      const asset = result.assets[0];
      
      const fileUri = asset.uri;
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
      const arrayBuffer = decode(base64);
      
      const safeName = asset.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const uniqueName = `${pin}/${Date.now()}_${safeName}`;
      
      const { error } = await supabase.storage.from('sync_files').upload(uniqueName, arrayBuffer, {
        contentType: asset.mimeType || 'application/octet-stream',
        upsert: true
      });
      
      if (error) throw error;
      fetchFiles(pin);
      Alert.alert("Success", "File uploaded to network");
    } catch (e: any) {
      Alert.alert('Upload Error', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    Alert.alert('Delete File', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.storage.from('sync_files').remove([`${pin}/${filename}`]);
        fetchFiles(pin);
      }}
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.loginCard}>
          <Lock color="#E50914" size={48} style={{ marginBottom: 20 }} />
          <Text style={styles.title}>Omni<Text style={{color: '#E50914'}}>Drop</Text></Text>
          <Text style={styles.subtitle}>Enter PIN to access secure network</Text>
          
          <View style={styles.inputContainer}>
            <KeyRound color="#808080" size={20} style={{position: 'absolute', left: 20, top: 22, zIndex: 1}} />
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              placeholder="****"
              placeholderTextColor="#808080"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>UNLOCK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Omni<Text style={{color: '#E50914'}}>Drop</Text></Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>SWITCH ROOM</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.uploadCard} onPress={handleUpload} disabled={uploading}>
          <UploadCloud color={uploading ? "#B3B3B3" : "#E50914"} size={48} />
          <Text style={styles.uploadTitle}>{uploading ? 'Transferring...' : 'Tap to Drop'}</Text>
          <Text style={styles.uploadSubtitle}>Send any file instantly to your devices</Text>
        </TouchableOpacity>

        {files.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Network Files</Text>
            {files.map(f => (
              <View key={f.name} style={styles.fileCard}>
                <View style={styles.fileInfo}>
                  <FileIcon color="#B3B3B3" size={24} />
                  <Text style={styles.fileName} numberOfLines={1}>{f.name.split('_').slice(1).join('_') || f.name}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(f.name)} style={styles.deleteBtn}>
                  <Trash2 color="#B3B3B3" size={20} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#141414', paddingTop: 60 },
  loginCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 36, fontWeight: '900', color: '#FFF', textTransform: 'uppercase', marginBottom: 5 },
  subtitle: { color: '#808080', marginBottom: 30 },
  inputContainer: { width: '100%', maxWidth: 300, marginBottom: 20, position: 'relative' },
  input: { backgroundColor: '#181818', borderColor: '#333', borderWidth: 1, borderRadius: 16, padding: 20, paddingLeft: 50, color: '#FFF', fontSize: 24, textAlign: 'center', letterSpacing: 10 },
  button: { backgroundColor: '#E50914', padding: 16, borderRadius: 16, width: '100%', maxWidth: 300, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold', letterSpacing: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', textTransform: 'uppercase' },
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#181818', borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  logoutText: { color: '#808080', fontSize: 12, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  uploadCard: { backgroundColor: '#181818', borderRadius: 20, padding: 40, alignItems: 'center', borderColor: '#333', borderWidth: 1, marginBottom: 30 },
  uploadTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 15 },
  uploadSubtitle: { color: '#808080', fontSize: 14, marginTop: 5 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  fileCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#181818', padding: 15, borderRadius: 12, marginBottom: 10, borderColor: '#333', borderWidth: 1 },
  fileInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 15 },
  fileName: { color: '#FFF', marginLeft: 10, flex: 1, fontWeight: '500' },
  deleteBtn: { padding: 8, backgroundColor: '#141414', borderRadius: 20, borderWidth: 1, borderColor: '#333' }
});
