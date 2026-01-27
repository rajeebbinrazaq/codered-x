import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, PanResponder, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Brightness from 'expo-brightness';

const ChannelScreen = ({ route, navigation }) => {
    const { initialChannel, allChannels } = route.params;

    const [activeChannel, setActiveChannel] = useState(initialChannel);
    const [currentIndex, setCurrentIndex] = useState(allChannels.findIndex(ch => ch.url === initialChannel.url));
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [status, setStatus] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
    const [gestureStatus, setGestureStatus] = useState({ visible: false, icon: '', text: '' });
    const [controlsVisible, setControlsVisible] = useState(true); // Default visible
    const [seekValue, setSeekValue] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);

    const videoRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const isFullscreenRef = useRef(isFullscreen);
    const initialGestureValue = useRef(0);
    const isAdjustingBrightness = useRef(false);

    const { width: windowWidth } = Dimensions.get('window');
    const insets = useSafeAreaInsets();

    useEffect(() => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        (async () => {
            const { status } = await Brightness.requestPermissionsAsync();
            if (status !== 'granted') console.warn('Brightness permission not granted');
        })();

        // Start auto-hide timer
        resetControlsTimer();

        return () => {
            ScreenOrientation.unlockAsync();
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const resetControlsTimer = useCallback(() => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        setControlsVisible(true);
        controlsTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 3000);
    }, []);

    const toggleControls = () => {
        if (controlsVisible) {
            setControlsVisible(false);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        } else {
            resetControlsTimer();
        }
    };

    const toggleFullscreen = async () => {
        resetControlsTimer();
        if (isFullscreen) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            setIsFullscreen(false);
        } else {
            // By default goes to LANDSCAPE_LEFT, but allows LANDSCAPE_RIGHT if rotated
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            setIsFullscreen(true);
        }
    };

    const toggleResizeMode = () => {
        resetControlsTimer();
        const modes = [ResizeMode.CONTAIN, ResizeMode.COVER, ResizeMode.STRETCH];
        const nextIndex = (modes.indexOf(resizeMode) + 1) % modes.length;
        setResizeMode(modes[nextIndex]);
    };

    const goToNextChannel = () => {
        resetControlsTimer();
        if (currentIndex < allChannels.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setActiveChannel(allChannels[nextIdx]);
            setIsLoading(true);
        }
    };

    const goToPrevChannel = () => {
        resetControlsTimer();
        if (currentIndex > 0) {
            const prevIdx = currentIndex - 1;
            setCurrentIndex(prevIdx);
            setActiveChannel(allChannels[prevIdx]);
            setIsLoading(true);
        }
    };
    const formatTime = (millis) => {
        if (!millis) return "00:00";
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // --- Gestures ---
    const showGestureStatus = (icon, text) => {
        setGestureStatus({ visible: true, icon, text });
        // Don't show controls on gesture, keeps it cleaner
        setTimeout(() => setGestureStatus({ visible: false, icon: '', text: '' }), 1000);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false, // Let touches pass for tap detection
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only capture swipes in landscape
                return isFullscreen && (Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10);
            },
            onPanResponderMove: (evt, { dx, dy, x0 }) => {
                const { width } = Dimensions.get('window');
                const delta = -dy / 3000;
                if (x0 < width / 2) {
                    // Brightness
                    (async () => {
                        const cur = await Brightness.getBrightnessAsync();
                        let next = cur + delta;
                        next = Math.max(0, Math.min(1, next));
                        await Brightness.setBrightnessAsync(next);
                        showGestureStatus('sunny', `${Math.round(next * 100)}%`);
                    })();
                } else {
                    // Volume (Approximate)
                    if (videoRef.current) {
                        // We rely on separate Volume UI or sync issues
                        // Just toggle Controls to show volume slider if we had one.
                        // For now we just don't have volume feedback except generic.
                        showGestureStatus('volume-high', 'Vol');
                        // Creating a volume set is tricky without status feedback loop
                    }
                }
            },
        })
    ).current;

    // Use current ref for isFullscreen inside callbacks if needed, but here we used state in render
    // PanResponder is recreated on render if we don't memoize, but refs are better. 
    // Actually, since we use `isFullscreen` in the boolean check for `onMoveShouldSetPanResponder`...
    // The previous implementation had a bug where the closure stale value was used.
    // Updated useEffect to handle header hiding based on component mount and fullscreen change
    // updated useEffect to handle fullscreen changes
    useEffect(() => {
        isFullscreenRef.current = isFullscreen;
        navigation.setOptions({
            headerShown: !isFullscreen,
            title: !isFullscreen ? activeChannel.title : '',
            headerLeft: undefined, // Allow default back button in portrait
        });
    }, [isFullscreen, navigation, activeChannel]);

    // ... (PanResponder logic remains similar, relying on ref) ...

    const panResponderRef = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return isFullscreenRef.current && (Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10);
            },
            onPanResponderGrant: async (evt, { x0 }) => {
                const { width } = Dimensions.get('window');
                if (x0 < width / 2) {
                    isAdjustingBrightness.current = true;
                    try {
                        initialGestureValue.current = await Brightness.getBrightnessAsync();
                    } catch (e) {
                        initialGestureValue.current = 0.5;
                    }
                } else {
                    isAdjustingBrightness.current = false;
                    if (videoRef.current) {
                        try {
                            const status = await videoRef.current.getStatusAsync();
                            initialGestureValue.current = status.isLoaded ? status.volume : 1.0;
                        } catch (e) {
                            initialGestureValue.current = 1.0;
                        }
                    }
                }
            },
            onPanResponderMove: (evt, { dy }) => {
                const sensitivity = 200; // pixels for a full 0 to 1 transition
                const delta = -dy / sensitivity;
                const nextValue = Math.max(0, Math.min(1, initialGestureValue.current + delta));

                if (isAdjustingBrightness.current) {
                    Brightness.setBrightnessAsync(nextValue);
                    showGestureStatus('sunny', `${Math.round(nextValue * 100)}%`);
                } else {
                    if (videoRef.current) {
                        videoRef.current.setVolumeAsync(nextValue);
                        const icon = nextValue === 0 ? 'volume-mute' : (nextValue < 0.5 ? 'volume-low' : 'volume-high');
                        showGestureStatus(icon, `${Math.round(nextValue * 100)}%`);
                    }
                }
            }
        })
    ).current;

    const renderControls = () => {
        if (!controlsVisible) return null;

        const ControlUnit = (
            <View style={styles.controlUnitContainer}>
                <View style={styles.unifiedControlUnit}>
                    {/* Resize Button */}
                    <TouchableOpacity onPress={toggleResizeMode} style={styles.unitBtn}>
                        <Ionicons name={resizeMode === ResizeMode.CONTAIN ? "resize" : "scan"} size={20} color={colors.playerControl} />
                    </TouchableOpacity>

                    {/* Mute Button */}
                    <TouchableOpacity onPress={() => videoRef.current?.setIsMutedAsync(!status.isMuted)} style={styles.unitBtn}>
                        <Ionicons name={status.isMuted ? "volume-mute" : "volume-high"} size={20} color={colors.playerControl} />
                    </TouchableOpacity>

                    {/* Seek Back */}
                    <TouchableOpacity style={styles.unitBtn} onPress={async () => {
                        if (videoRef.current) {
                            const status = await videoRef.current.getStatusAsync();
                            videoRef.current.setPositionAsync(Math.max(0, status.positionMillis - 10000));
                        }
                    }}>
                        <Ionicons name="play-back" size={20} color={colors.playerControl} />
                    </TouchableOpacity>

                    {/* Play/Pause */}
                    <TouchableOpacity style={styles.unitPlayBtn} onPress={() => {
                        resetControlsTimer();
                        if (status.isPlaying) videoRef.current.pauseAsync();
                        else videoRef.current.playAsync();
                    }}>
                        <Ionicons name={status.isPlaying ? "pause" : "play"} size={32} color={colors.playerControl} />
                    </TouchableOpacity>

                    {/* Seek Forward */}
                    <TouchableOpacity style={styles.unitBtn} onPress={async () => {
                        if (videoRef.current) {
                            const status = await videoRef.current.getStatusAsync();
                            videoRef.current.setPositionAsync(status.positionMillis + 10000);
                        }
                    }}>
                        <Ionicons name="play-forward" size={20} color={colors.playerControl} />
                    </TouchableOpacity>

                    {/* Fullscreen Toggle */}
                    <TouchableOpacity onPress={toggleFullscreen} style={styles.unitBtn}>
                        <Ionicons name={isFullscreen ? "contract" : "expand"} size={20} color={colors.playerControl} />
                    </TouchableOpacity>
                </View>

                <View style={styles.seekbarContainer}>
                    <Text style={styles.timeText}>{formatTime(isSeeking ? seekValue : status.positionMillis)}</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={status.durationMillis || 0}
                        value={isSeeking ? seekValue : (status.positionMillis || 0)}
                        onValueChange={(val) => {
                            setIsSeeking(true);
                            setSeekValue(val);
                            resetControlsTimer();
                        }}
                        onSlidingComplete={async (val) => {
                            if (videoRef.current) {
                                await videoRef.current.setPositionAsync(val);
                            }
                            setIsSeeking(false);
                            resetControlsTimer();
                        }}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor="rgba(255,255,255,0.3)"
                        thumbTintColor={colors.primary}
                    />
                    <Text style={styles.timeText}>{formatTime(status.durationMillis)}</Text>
                </View>
            </View>
        );

        if (!isFullscreen) {
            return (
                <View style={[styles.controlsOverlay, { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 5 }]}>
                    {ControlUnit}
                </View>
            );
        } else {
            return (
                <View style={[styles.controlsOverlay, { backgroundColor: 'rgba(0,0,0,0.3)', paddingTop: insets.top }]}>
                    {/* Top Bar - Header in Landscape */}
                    <View style={styles.topControls}>
                        <TouchableOpacity style={styles.backButton} onPress={toggleFullscreen}>
                            <Ionicons name="arrow-back" size={24} color={colors.playerControl} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} numberOfLines={1}>{activeChannel.title}</Text>
                    </View>

                    {/* Bottom - Grouped Controls at the bottom */}
                    <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 15 }}>
                        {ControlUnit}
                    </View>
                </View>
            );
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style={isFullscreen ? "light" : "dark"} hidden={isFullscreen} />

            <View
                style={[
                    styles.videoSection,
                    isFullscreen ? styles.videoSectionFullscreen : styles.videoSectionEmbedded
                ]}
                {...panResponderRef.panHandlers}
            >
                <TouchableWithoutFeedback onPress={toggleControls}>
                    <View style={StyleSheet.absoluteFill}>
                        <Video
                            ref={videoRef}
                            style={{ width: '100%', height: '100%' }}
                            source={{
                                uri: activeChannel.url,
                                headers: { 'User-Agent': 'Mozilla/5.0 ...' }
                            }}
                            useNativeControls={false}
                            resizeMode={resizeMode}
                            isLooping={false}
                            shouldPlay
                            onPlaybackStatusUpdate={s => {
                                setStatus(() => s);
                                if (s.isLoaded) setIsLoading(false);
                            }}
                            onLoadStart={() => setIsLoading(true)}
                        />

                        {/* Controls Layer */}
                        {renderControls()}

                        {/* Loading Layer */}
                        {isLoading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        )}

                        {/* Gesture Status Layer */}
                        {gestureStatus.visible && (
                            <View style={styles.gestureOverlay}>
                                <Ionicons name={gestureStatus.icon} size={60} color={colors.gestureFeedback} />
                                <Text style={styles.gestureText}>{gestureStatus.text}</Text>
                            </View>
                        )}
                    </View>
                </TouchableWithoutFeedback>
            </View>

            {/* List - Only visible in Portrait */}
            {!isFullscreen && (
                <View style={styles.listContainer}>
                    <FlatList
                        data={allChannels}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.card, activeChannel.url === item.url && styles.activeCard]}
                                onPress={() => { setActiveChannel(item); setCurrentIndex(allChannels.indexOf(item)); setIsLoading(true); }}
                            >
                                <View style={styles.iconContainer}>
                                    {item.logo ? <Image source={{ uri: item.logo }} style={styles.logo} resizeMode="contain" /> : <Ionicons name="tv-outline" size={32} color={colors.textSecondary} />}
                                </View>
                                <View style={styles.info}>
                                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.subtitle}>{item.group}</Text>
                                </View>
                                <Ionicons name="play-circle" size={32} color={activeChannel.url === item.url ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.list}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    videoSection: {
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    videoSectionEmbedded: {
        height: 250,
        width: '100%', // Ensures it matches display width
    },
    videoSectionFullscreen: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
        backgroundColor: '#000',
    },
    listContainer: {
        flex: 1,
    },
    list: {
        padding: spacing.m,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: spacing.s,
        padding: spacing.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    activeCard: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(255, 59, 48, 0.1)', // Subtle red tint
    },
    iconContainer: {
        width: 60,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        borderRadius: 8,
        marginRight: spacing.m,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    info: {
        flex: 1,
    },
    title: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        zIndex: 50,
    },
    gestureOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -50,
        marginTop: -60,
        width: 100,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 60,
        pointerEvents: 'none',
    },
    gestureText: {
        color: colors.gestureFeedback,
        fontWeight: 'bold',
        fontSize: 20,
        marginTop: 8,
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        padding: 10,
        zIndex: 100,
    },
    topControls: {
        flexDirection: 'row', // Empty top bar
        height: 40,
    },
    bottomControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bottomControlsEnd: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    centerControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    controlBtn: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
    },
    playPauseBtn: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 40,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
    },
    headerTitle: {
        flex: 1,
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginRight: 40,
    },
    unifiedControlUnit: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15,
        paddingTop: 5,
        paddingBottom: 0,
        gap: 12,
    },
    controlUnitContainer: {
        width: '95%',
        maxWidth: 700,
        borderRadius: 20,
        padding: 5,
        alignItems: 'center',
    },
    seekbarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 15,
        paddingTop: 0,
        paddingBottom: 10,
        marginTop: -5,
    },
    timeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        minWidth: 45,
        textAlign: 'center',
    },
    slider: {
        flex: 1,
        height: 40,
    },
    unitBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unitPlayBtn: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
    },
});

export default ChannelScreen;
