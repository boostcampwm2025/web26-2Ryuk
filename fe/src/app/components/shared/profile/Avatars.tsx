'use client';

import styles from './avatar.module.css';
import Avatar from './Avatar';
import AvatarCount from './AvatarCount';
import { AvatarsProps } from './type';

function Avatars({ profiles = [], viewCount = 3 }: AvatarsProps) {
  const length = profiles.length;
  const visibleImages = profiles.slice(0, viewCount);
  const rest = length - viewCount;

  return (
    <div className={styles.avatars}>
      {visibleImages.map((profile, index) => (
        <Avatar
          key={`avatar-${index}`}
          nickname={profile.nickname}
          profileImage={profile.profileImage}
        />
      ))}
      {rest > 0 && <AvatarCount count={rest} />}
    </div>
  );
}

export default Avatars;
