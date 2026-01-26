import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Text, Dimensions, PanResponder } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { colors, spacing } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Brightness from 'expo-brightness';

const PlayerScreen = ({ route, navigation }) => {
  const { url, title } = route.params;
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
  const [isLandscape, setIsLandscape] = useState(false);
  const [gestureStatus, setGestureStatus] = useState({ visible: false, icon: '', text: '' });
  const insets = useSafeAreaInsets();
  const timeoutRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Brightness permission not granted');
      }
    })();

    const subscription = ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
      const isLand = orientationInfo.orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        orientationInfo.orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
      setIsLandscape(isLand);
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const toggleResizeMode = () => {
    const modes = [ResizeMode.CONTAIN, ResizeMode.COVER, ResizeMode.STRETCH];
    const nextIndex = (modes.indexOf(resizeMode) + 1) % modes.length;
    setResizeMode(modes[nextIndex]);
  };

  const toggleOrientation = async () => {
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
    }
  };

  const showGestureStatus = (icon, text) => {
    setGestureStatus({ visible: true, icon, text });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setGestureStatus({ visible: false, icon: '', text: '' });
    }, 1000);
  };

  const adjustBrightness = async (delta) => {
    const cur = await Brightness.getBrightnessAsync();
    let next = cur + delta;
    next = Math.max(0, Math.min(1, next));
    await Brightness.setBrightnessAsync(next);
    showGestureStatus('sunny', `${Math.round(next * 100)}%`);
  };

  const adjustVolume = async (delta) => {
    if (videoRef.current) {
      // Approximate volume logic since we can't get sync volume easily
      // We rely on the last known status volume or default to 1
      const currentVol = status.volume ?? 1.0;
      let next = currentVol + delta;
      next = Math.max(0, Math.min(1, next));
      videoRef.current.setVolumeAsync(next);
      showGestureStatus('volume-high', `${Math.round(next * 100)}%`);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, { dx, dy, moveY, x0 }) => {
        const { width, height } = Dimensions.get('window');
        // Sensitivity factor
        const delta = -dy / 3000;

        if (x0 < width / 2) {
          // Left side: Brightness
          adjustBrightness(delta);
        } else {
          // Right side: Volume
          adjustVolume(delta);
        }
      },
      onPanResponderRelease: () => {
        // Interaction end
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.videoContainer} {...panResponder.panHandlers}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={{
            uri: url,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            }
          }}
          useNativeControls
          resizeMode={resizeMode}
          isLooping={false}
          shouldPlay
          onPlaybackStatusUpdate={status => {
            setStatus(() => status);
            if (status.isLoaded) setIsLoading(false);
          }}
          onError={(error) => {
            setIsLoading(false);
            console.log("Playback error", error);
          }}
          onLoadStart={() => setIsLoading(true)}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Stream...</Text>
        </View>
      )}

      {gestureStatus.visible && (
        <View style={styles.gestureOverlay}>
          <Ionicons name={gestureStatus.icon} size={40} color="white" />
          <Text style={styles.gestureText}>{gestureStatus.text}</Text>
        </View>
      )}

      <View style={[styles.controls, { top: insets.top + spacing.s, left: insets.left + spacing.s, right: insets.right + spacing.s }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.rightControls}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleResizeMode}>
            <Ionicons name={resizeMode === ResizeMode.CONTAIN ? "resize" : "scan"} size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={toggleOrientation}>
            <Ionicons name="phone-landscape-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    pointerEvents: 'none',
  },
  loadingText: {
    color: 'white',
    marginTop: spacing.s,
  },
  gestureOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    pointerEvents: 'none',
  },
  gestureText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 4,
  },
  controls: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  rightControls: {
    flexDirection: 'row',
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.s,
  },
});

export default PlayerScreen;
