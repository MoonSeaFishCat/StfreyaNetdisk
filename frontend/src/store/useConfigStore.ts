import { create } from 'zustand';
import request from '../utils/request';

interface ConfigState {
  siteName: string;
  siteAnnouncement: string;
  allowRegister: boolean;
  fetchPublicConfigs: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  siteName: 'Stfreya Netdisk',
  siteAnnouncement: '',
  allowRegister: true,
  fetchPublicConfigs: async () => {
    try {
      const res: any = await request.get('/auth/config');
      if (res.data) {
        set({
          siteName: res.data.site_name || 'Stfreya Netdisk',
          siteAnnouncement: res.data.site_announcement || '',
          allowRegister: res.data.allow_register === 'true',
        });
        // 更新页面标题
        if (res.data.site_name) {
          document.title = res.data.site_name;
        }
      }
    } catch (error) {
      console.error('Failed to fetch public configs', error);
    }
  },
}));
