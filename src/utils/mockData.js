import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseM3U } from './m3uParser';

const PLAYLISTS_KEY = 'user_playlists_v2';
const ACTIVE_KEY = 'active_playlist_id_v2';

export const MOCK_PLAYLIST = `#EXTM3U
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_Buck_Bunny_needs_creative_commons_attribution_icon_by_blender_foundation.svg/1200px-Big_Buck_Bunny_needs_creative_commons_attribution_icon_by_blender_foundation.svg.png" group-title="Movies",Big Buck Bunny
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/NASA_logo.svg/1200px-NASA_logo.svg.png" group-title="Science",NASA TV
https://ntv1.akamaized.net/hls/live/2013530/NASA-NTV1-HLS/master.m3u8
#EXTINF:-1 group-title="News",Sintel
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4
`;

export const getPlaylistData = async () => {
    try {
        const activeId = await AsyncStorage.getItem(ACTIVE_KEY);
        const stored = await AsyncStorage.getItem(PLAYLISTS_KEY);
        const playlists = stored ? JSON.parse(stored) : [];

        if (activeId) {
            const active = playlists.find(p => p.id === activeId);
            if (active) return active.channels;
        }

        // Default fallback if nothing selected or stored
        return parseM3U(MOCK_PLAYLIST);
    } catch (e) {
        console.error("Failed to load playlist", e);
        return parseM3U(MOCK_PLAYLIST);
    }
};

export const getPlaylists = async () => {
    try {
        const stored = await AsyncStorage.getItem(PLAYLISTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const getActivePlaylistId = async () => {
    try {
        return await AsyncStorage.getItem(ACTIVE_KEY);
    } catch (e) {
        return null;
    }
};

export const selectPlaylist = async (id) => {
    try {
        await AsyncStorage.setItem(ACTIVE_KEY, id);
        return true;
    } catch (e) {
        return false;
    }
};

export const addPlaylist = async (name, channels) => {
    try {
        const playlists = await getPlaylists();
        const newPlaylist = {
            id: Date.now().toString(),
            name,
            channels,
            createdAt: new Date().toISOString()
        };

        playlists.push(newPlaylist);
        await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));

        // Auto-select if it's the first one
        if (playlists.length === 1) {
            await selectPlaylist(newPlaylist.id);
        }

        return true;
    } catch (e) {
        console.error("Failed to save playlist", e);
        return false;
    }
};

export const deletePlaylist = async (id) => {
    try {
        console.log(`Attempting to delete playlist with ID: ${id}`);
        const playlists = await getPlaylists();
        console.log('Current stored IDs:', playlists.map(p => ({ id: p.id, type: typeof p.id })));
        const initialLength = playlists.length;

        const updatedPlaylists = playlists.filter(p => String(p.id) !== String(id));

        if (updatedPlaylists.length === initialLength) {
            console.warn(`Playlist with ID ${id} not found.`);
            return false;
        }

        await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updatedPlaylists));
        console.log(`Playlist deleted. New count: ${updatedPlaylists.length}`);

        // If the deleted playlist was active, clear the selection
        const activeId = await getActivePlaylistId();
        if (String(activeId) === String(id)) {
            await AsyncStorage.removeItem(ACTIVE_KEY);
        }

        return true;
    } catch (e) {
        console.error("Failed to delete playlist", e);
        return false;
    }
};

export const renamePlaylist = async (id, newName) => {
    try {
        const playlists = await getPlaylists();
        const playlistIndex = playlists.findIndex(p => p.id === id);

        if (playlistIndex !== -1) {
            playlists[playlistIndex].name = newName;
            await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
            return true;
        }
        return false;
    } catch (e) {
        console.error("Failed to rename playlist", e);
        return false;
    }
};
