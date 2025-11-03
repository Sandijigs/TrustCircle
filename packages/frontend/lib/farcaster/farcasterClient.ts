/**
 * Farcaster Client - API Integration
 * Provides abstraction over Neynar API and Farcaster Hub API
 */

import type {
  FarcasterUser,
  FarcasterCast,
  NeynarUserResponse,
  NeynarCastsResponse,
  HubAPIResponse,
} from './types';

// API Configuration
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '';
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';
const HUB_API_URL = process.env.FARCASTER_HUB_URL || 'https://hub.farcaster.xyz';

/**
 * Farcaster API Client
 */
export class FarcasterClient {
  private neynarApiKey: string;
  private useNeynar: boolean;

  constructor(apiKey?: string) {
    this.neynarApiKey = apiKey || NEYNAR_API_KEY;
    this.useNeynar = !!this.neynarApiKey;
  }

  /**
   * Fetch user profile by FID
   */
  async getUserByFID(fid: number): Promise<FarcasterUser | null> {
    try {
      if (this.useNeynar) {
        return await this.getUserByFIDNeynar(fid);
      } else {
        return await this.getUserByFIDHub(fid);
      }
    } catch (error) {
      console.error('Error fetching user by FID:', error);
      return null;
    }
  }

  /**
   * Fetch user profile by username
   */
  async getUserByUsername(username: string): Promise<FarcasterUser | null> {
    try {
      if (this.useNeynar) {
        const response = await fetch(
          `${NEYNAR_BASE_URL}/farcaster/user/by_username?username=${username}`,
          {
            headers: {
              'api_key': this.neynarApiKey,
            },
            next: { revalidate: 3600 },
          }
        );

        if (!response.ok) {
          throw new Error(`Neynar API error: ${response.status}`);
        }

        const data: NeynarUserResponse = await response.json();
        return this.transformNeynarUser(data.result.user);
      } else {
        // Hub API doesn't support username lookup directly
        // Would need to iterate or maintain a mapping
        console.warn('Username lookup requires Neynar API');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
  }

  /**
   * Get verified addresses for a FID
   */
  async getVerifiedAddresses(fid: number): Promise<string[]> {
    try {
      const response = await fetch(
        `${HUB_API_URL}/v1/verificationsByFid?fid=${fid}`,
        { next: { revalidate: 3600 } }
      );

      if (!response.ok) {
        return [];
      }

      const data: HubAPIResponse = await response.json();
      const addresses = data.messages
        .filter((msg) => msg.data.type === 'MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS')
        .map((msg) => msg.data.body?.address)
        .filter(Boolean);

      return addresses;
    } catch (error) {
      console.error('Error fetching verified addresses:', error);
      return [];
    }
  }

  /**
   * Get FID from wallet address
   */
  async getFIDFromAddress(address: string): Promise<number | null> {
    try {
      const response = await fetch(
        `${HUB_API_URL}/v1/verificationsByAddress?address=${address.toLowerCase()}`,
        { next: { revalidate: 3600 } }
      );

      if (!response.ok) {
        return null;
      }

      const data: HubAPIResponse = await response.json();
      if (data.messages && data.messages.length > 0) {
        return data.messages[0].data.fid;
      }

      return null;
    } catch (error) {
      console.error('Error getting FID from address:', error);
      return null;
    }
  }

  /**
   * Fetch user's casts (posts)
   */
  async getUserCasts(fid: number, limit = 100): Promise<FarcasterCast[]> {
    try {
      if (this.useNeynar) {
        return await this.getUserCastsNeynar(fid, limit);
      } else {
        return await this.getUserCastsHub(fid, limit);
      }
    } catch (error) {
      console.error('Error fetching user casts:', error);
      return [];
    }
  }

  /**
   * Fetch followers for a user
   */
  async getFollowers(fid: number, limit = 1000): Promise<number[]> {
    try {
      if (this.useNeynar) {
        const response = await fetch(
          `${NEYNAR_BASE_URL}/farcaster/followers?fid=${fid}&limit=${limit}`,
          {
            headers: { 'api_key': this.neynarApiKey },
            next: { revalidate: 3600 },
          }
        );

        if (!response.ok) {
          return [];
        }

        const data = await response.json();
        return data.result.users.map((u: any) => u.fid);
      } else {
        return await this.getFollowersHub(fid);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  }

  /**
   * Fetch following for a user
   */
  async getFollowing(fid: number, limit = 1000): Promise<number[]> {
    try {
      if (this.useNeynar) {
        const response = await fetch(
          `${NEYNAR_BASE_URL}/farcaster/following?fid=${fid}&limit=${limit}`,
          {
            headers: { 'api_key': this.neynarApiKey },
            next: { revalidate: 3600 },
          }
        );

        if (!response.ok) {
          return [];
        }

        const data = await response.json();
        return data.result.users.map((u: any) => u.fid);
      } else {
        return await this.getFollowingHub(fid);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  }

  /**
   * Check if user1 follows user2
   */
  async checkFollow(followerFid: number, followeeFid: number): Promise<boolean> {
    try {
      const following = await this.getFollowing(followerFid);
      return following.includes(followeeFid);
    } catch (error) {
      return false;
    }
  }

  /**
   * Publish a cast
   */
  async publishCast(
    signerUuid: string,
    text: string,
    options?: {
      embeds?: string[];
      channelId?: string;
      parentCastHash?: string;
    }
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      if (!this.useNeynar) {
        return { success: false, error: 'Publishing requires Neynar API' };
      }

      const response = await fetch(`${NEYNAR_BASE_URL}/farcaster/cast`, {
        method: 'POST',
        headers: {
          'api_key': this.neynarApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signer_uuid: signerUuid,
          text,
          ...options,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const data = await response.json();
      return { success: true, hash: data.result.cast.hash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Private methods for Neynar API
  private async getUserByFIDNeynar(fid: number): Promise<FarcasterUser | null> {
    const response = await fetch(`${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fid}`, {
      headers: { 'api_key': this.neynarApiKey },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.users && data.users.length > 0) {
      return this.transformNeynarUser(data.users[0]);
    }

    return null;
  }

  private async getUserCastsNeynar(fid: number, limit: number): Promise<FarcasterCast[]> {
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/casts?fid=${fid}&limit=${limit}`,
      {
        headers: { 'api_key': this.neynarApiKey },
        next: { revalidate: 1800 },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data: NeynarCastsResponse = await response.json();
    return data.result.casts.map(this.transformNeynarCast);
  }

  private transformNeynarUser(user: any): FarcasterUser {
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text,
      followerCount: user.follower_count,
      followingCount: user.following_count,
      verifiedAddresses: user.verifications || [],
      custodyAddress: user.custody_address,
      activeStatus: user.active_status === 'active' ? 'active' : 'inactive',
      registeredAt: new Date(user.registered_at || Date.now()),
    };
  }

  private transformNeynarCast(cast: any): FarcasterCast {
    return {
      hash: cast.hash,
      text: cast.text,
      author: {
        fid: cast.author.fid,
        username: cast.author.username,
        pfpUrl: cast.author.pfp_url,
      },
      timestamp: new Date(cast.timestamp),
      reactions: {
        likes: cast.reactions.likes_count || 0,
        recasts: cast.reactions.recasts_count || 0,
        replies: cast.replies.count || 0,
      },
      embeds: cast.embeds,
      parentCastHash: cast.parent_hash,
      parentUrl: cast.parent_url,
    };
  }

  // Private methods for Hub API (fallback)
  private async getUserByFIDHub(fid: number): Promise<FarcasterUser | null> {
    const response = await fetch(`${HUB_API_URL}/v1/userDataByFid?fid=${fid}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const data: HubAPIResponse = await response.json();
    const userData: any = {};

    data.messages.forEach((msg) => {
      const type = msg.data.body?.type;
      const value = msg.data.body?.value;
      
      if (type === 'USER_DATA_TYPE_USERNAME') userData.username = value;
      if (type === 'USER_DATA_TYPE_DISPLAY') userData.displayName = value;
      if (type === 'USER_DATA_TYPE_BIO') userData.bio = value;
      if (type === 'USER_DATA_TYPE_PFP') userData.pfpUrl = value;
    });

    const [followerCount, followingCount, verifiedAddresses] = await Promise.all([
      this.getFollowersHub(fid).then((f) => f.length),
      this.getFollowingHub(fid).then((f) => f.length),
      this.getVerifiedAddresses(fid),
    ]);

    return {
      fid,
      username: userData.username || 'unknown',
      displayName: userData.displayName || '',
      pfpUrl: userData.pfpUrl,
      bio: userData.bio,
      followerCount,
      followingCount,
      verifiedAddresses,
      custodyAddress: '',
      activeStatus: 'active',
      registeredAt: new Date(),
    };
  }

  private async getUserCastsHub(fid: number, limit: number): Promise<FarcasterCast[]> {
    const response = await fetch(
      `${HUB_API_URL}/v1/castsByFid?fid=${fid}&pageSize=${limit}`,
      { next: { revalidate: 1800 } }
    );

    if (!response.ok) {
      return [];
    }

    const data: HubAPIResponse = await response.json();
    
    return data.messages.map((msg) => ({
      hash: msg.hash,
      text: msg.data.body?.text || '',
      author: {
        fid: msg.data.fid,
        username: '',
      },
      timestamp: new Date(msg.data.timestamp * 1000),
      reactions: {
        likes: 0,
        recasts: 0,
        replies: 0,
      },
    }));
  }

  private async getFollowersHub(fid: number): Promise<number[]> {
    const response = await fetch(
      `${HUB_API_URL}/v1/linksByTargetFid?fid=${fid}&link_type=follow`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return [];
    }

    const data: HubAPIResponse = await response.json();
    return data.messages.map((msg) => msg.data.fid);
  }

  private async getFollowingHub(fid: number): Promise<number[]> {
    const response = await fetch(
      `${HUB_API_URL}/v1/linksByFid?fid=${fid}&link_type=follow`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return [];
    }

    const data: HubAPIResponse = await response.json();
    return data.messages.map((msg) => msg.data.body?.targetFid).filter(Boolean);
  }
}

// Export singleton instance
export const farcasterClient = new FarcasterClient();

// Export helper functions
export const getUserByFID = (fid: number) => farcasterClient.getUserByFID(fid);
export const getUserByUsername = (username: string) => farcasterClient.getUserByUsername(username);
export const getFIDFromAddress = (address: string) => farcasterClient.getFIDFromAddress(address);
export const getVerifiedAddresses = (fid: number) => farcasterClient.getVerifiedAddresses(fid);
export const getUserCasts = (fid: number, limit?: number) => farcasterClient.getUserCasts(fid, limit);
export const getFollowers = (fid: number) => farcasterClient.getFollowers(fid);
export const getFollowing = (fid: number) => farcasterClient.getFollowing(fid);
export const checkFollow = (followerFid: number, followeeFid: number) =>
  farcasterClient.checkFollow(followerFid, followeeFid);
