import styles from '@/app/components/helpers/components.module.css';
import { ChatBubbles, ChatConverter } from '@/app/features/chat';
import ChatBubble from '@/app/features/chat/components/ChatBubble';
import PopularPosts from '@/app/features/post/components/PopularPosts';
import PostListRow from '@/app/features/post/components/PostListRow';
import PostListItem from '@/app/features/post/components/PostListItem';
import Component from '@/app/components/helpers/Component';
import ComponentRelations from '@/app/components/helpers/ComponentRelations';
import globalChatMock from '@/mocks/data/globalChat.json';
import postListCardMock from '@/mocks/data/postListCard.json';
import { PostConverter } from '@/app/features/post/dtos/Post';
import RoomChatPanel from '@/app/features/chat/components/LocalChatPanel';
import MicSetting from '@/app/features/room/components/creation/MicSetting';
import PasswordSetting from '@/app/features/room/components/creation/PasswordSetting';
import RoomCreateModalContent from '@/app/features/room/components/creation/RoomCreateModalContent';
import RoomUpdateModalContent from '@/app/features/room/components/creation/RoomUpdateModalContent';
import RealtimeRoomsSection from '@/app/features/room/components/RealtimeRoomsSection';
import RoomCard from '@/app/features/room/components/card/RoomCard';
import RoomInfo from '@/app/features/room/components/info/RoomInfo';
import Modal from '@/app/components/shared/modal/Modal';
import GlobalChatPanel from '@/app/features/chat/components/GlobalChatPanel';
import AudioControlButtons from '@/app/features/voice/components/AudioControlButtons';
import SpeakerControlButton from '@/app/features/voice/components/SpeakerControlButton';
import * as TextButton from '@/app/components/shared/button/TextButton';
import Dialog from '@/app/components/shared/dialog/Dialog';
import Paths from '@/app/shared/path';

export default function FeatureComponents() {
  return (
    <>
      <section id="chat-bubble" className={styles.section}>
        <h2 className={styles.sectionTitle}>ChatBubble</h2>
        <ComponentRelations componentId="chat-bubble" />
        <div className={styles.chatRow}>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Other User</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <ChatBubble
                  id="1"
                  sender={{
                    role: 'user',
                    nickname: '상대방',
                    profileImage: 'https://i.pravatar.cc/150?img=1',
                    isMe: false,
                  }}
                  message="Their Message"
                  timestamp={new Date('2024-01-15T14:31:00.000Z')}
                />
              </Component>
            </div>
          </div>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Me</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <ChatBubble
                  id="2"
                  sender={{
                    role: 'user',
                    nickname: '나',
                    profileImage: 'https://i.pravatar.cc/150?img=2',
                    isMe: true,
                  }}
                  message="My Message"
                  timestamp={new Date('2024-01-15T14:31:00.000Z')}
                />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="chat-bubbles" className={styles.section}>
        <h2 className={styles.sectionTitle}>ChatBubbles</h2>
        <ComponentRelations componentId="chat-bubbles" />
        <div className={styles.showcaseBlock}>
          <Component>
            <ChatBubbles chats={globalChatMock.chats.map(ChatConverter.toReceiveData)} />
          </Component>
        </div>
      </section>

      <section id="global-chat-panel" className={styles.section}>
        <h2 className={styles.sectionTitle}>GlobalChatPanel</h2>
        <ComponentRelations componentId="global-chat-panel" />
        <div className={styles.showcaseBlock}>
          <Component>
            <GlobalChatPanel />
          </Component>
        </div>
      </section>

      <section id="room-chat-panel" className={styles.section}>
        <h2 className={styles.sectionTitle}>RoomChatPanel</h2>
        <ComponentRelations componentId="room-chat-panel" />
        <div className={styles.showcaseBlock}>
          <Component>
            <RoomChatPanel />
          </Component>
        </div>
      </section>

      <section id="speaker-control-button" className={styles.section}>
        <h2 className={styles.sectionTitle}>SpeakerControlButton</h2>
        <ComponentRelations componentId="speaker-control-button" />
        <div className={styles.chatRow}>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Active</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <SpeakerControlButton initialState={true} />
              </Component>
            </div>
          </div>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Muted</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <SpeakerControlButton initialState={false} />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="audio-control-buttons" className={styles.section}>
        <h2 className={styles.sectionTitle}>AudioControlButtons</h2>
        <ComponentRelations componentId="audio-control-buttons" />
        <div className={styles.chatRow}>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Both Active</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <AudioControlButtons initialMicState={true} initialSpeakerState={true} />
              </Component>
            </div>
          </div>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Mic Muted</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <AudioControlButtons initialMicState={false} initialSpeakerState={true} />
              </Component>
            </div>
          </div>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>Both Muted</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <AudioControlButtons initialMicState={false} initialSpeakerState={false} />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="post-list-row" className={styles.section}>
        <h2 className={styles.sectionTitle}>PostListRow</h2>
        <ComponentRelations componentId="post-list-row" />
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Default</h3>
          <div className={styles.buttonColumn}>
            <Component fullWidth>
              <PostListRow
                id="1"
                title="Title"
                content="Content"
                category="free"
                createDate={new Date('2024-01-15T14:31:00.000Z')}
                updateDate={new Date('2024-01-15T14:31:00.000Z')}
                viewCount={0}
                likeCount={0}
                commentCount={0}
                authorId="1"
                authorNickname="Author"
                isMe={false}
              />
            </Component>
          </div>
        </div>
      </section>

      <section id="post-list-item" className={styles.section}>
        <h2 className={styles.sectionTitle}>PostListItem</h2>
        <ComponentRelations componentId="post-list-item" />
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Default</h3>
          <div className={styles.buttonColumn}>
            <Component>
              <PostListItem
                id="1"
                title="Title"
                tags={['#tag1', '#tag2', '#tag3']}
                viewCount={0}
                likeCount={0}
                commentCount={0}
                createDate={new Date('2024-01-15T14:31:00.000Z')}
              />
            </Component>
          </div>
        </div>
      </section>

      <section id="post-list-items" className={styles.section}>
        <h2 className={styles.sectionTitle}>PostListItems</h2>
        <ComponentRelations componentId="post-list-items" />
        <div className={styles.showcaseBlock}>
          <Component>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {postListCardMock.posts.slice(0, 3).map((post) => {
                const postData = PostConverter.toData(post);
                return (
                  <PostListItem
                    key={postData.id}
                    id={postData.id}
                    title={postData.title}
                    tags={postData.tags}
                    createDate={postData.createDate}
                    updateDate={postData.updateDate}
                    viewCount={postData.viewCount}
                    likeCount={postData.likeCount}
                    commentCount={postData.commentCount}
                  />
                );
              })}
            </ul>
          </Component>
        </div>
      </section>

      <section id="popular-posts-section" className={styles.section}>
        <h2 className={styles.sectionTitle}>PopularPostsSection</h2>
        <ComponentRelations componentId="popular-posts-section" />
        <div className={styles.showcaseBlock}>
          <Component>
            <PopularPosts posts={postListCardMock.posts.map(PostConverter.toData)} viewCount={2} />
          </Component>
        </div>
      </section>

      <section id="mic-setting" className={styles.section}>
        <h2 className={styles.sectionTitle}>MicSetting</h2>
        <ComponentRelations componentId="mic-setting" />
        <div className={styles.showcaseBlock}>
          <Component>
            <MicSetting />
          </Component>
        </div>
      </section>

      <section id="password-setting" className={styles.section}>
        <h2 className={styles.sectionTitle}>PasswordSetting</h2>
        <ComponentRelations componentId="password-setting" />
        <div className={styles.showcaseBlock}>
          <Component>
            <PasswordSetting initialChecked={true} initialPassword="" />
          </Component>
        </div>
      </section>

      <section id="room-creation-modal" className={styles.section}>
        <h2 className={styles.sectionTitle}>RoomCreateModal</h2>
        <ComponentRelations componentId="room-creation-modal" />
        <div className={styles.showcaseBlock}>
          <Component>
            <TextButton.Ghost modalId="room-creation-demo" text="모달 열기" size="medium" />
            <Modal id="room-creation-demo">
              <RoomCreateModalContent submitText="방 만들기" />
            </Modal>
          </Component>
        </div>
      </section>

      <section id="room-update-modal" className={styles.section}>
        <h2 className={styles.sectionTitle}>RoomUpdateModal</h2>
        <ComponentRelations componentId="room-update-modal" />
        <div className={styles.showcaseBlock}>
          <Component>
            <TextButton.Ghost modalId="room-update-demo" text="모달 열기" size="medium" />
            <Modal id="room-update-demo">
              <RoomUpdateModalContent submitText="수정하기" />
            </Modal>
          </Component>
        </div>
      </section>

      <section id="room-card" className={styles.section}>
        <h2 className={styles.sectionTitle}>RoomCard</h2>
        <ComponentRelations componentId="room-card" />
        <div className={styles.chatRow}>
          <div className={styles.showcaseBlock}>
            <h3 className={styles.blockTitle}>RoomCard</h3>
            <div className={styles.buttonColumn}>
              <Component>
                <RoomCard
                  id="1"
                  hostId="123e4567-e89b-12d3-a456-426614174000"
                  title="Title"
                  tags={['#tag1', '#tag2']}
                  currentParticipants={5}
                  maxParticipants={10}
                  isMicAvailable
                  isPrivate={false}
                  createDate={new Date('2024-01-15T14:31:00.000Z')}
                  participants={[
                    {
                      userId: '1',
                      nickname: 'User1',
                      profileImage: 'https://i.pravatar.cc/150?img=1',
                    },
                    {
                      userId: '2',
                      nickname: 'User2',
                      profileImage: 'https://i.pravatar.cc/150?img=2',
                    },
                    {
                      userId: '3',
                      nickname: 'User3',
                      profileImage: 'https://i.pravatar.cc/150?img=3',
                    },
                    {
                      userId: '4',
                      nickname: 'User4',
                      profileImage: 'https://i.pravatar.cc/150?img=4',
                    },
                  ]}
                />
              </Component>
            </div>
          </div>
        </div>
      </section>

      <section id="room-info" className={styles.section}>
        <h2 className={styles.sectionTitle}>RoomInfo</h2>
        <ComponentRelations componentId="room-info" />
        <div className={styles.showcaseBlock}>
          <h3 className={styles.blockTitle}>Default</h3>
          <Component>
            <RoomInfo
              title="같이 수다 떨어요~"
              tags={['게임', '친목']}
              isHost={false}
              isMicAvailable={true}
              isPrivate={false}
            />
          </Component>
          <Component>
            <RoomInfo
              title="같이 수다 떨어요~"
              tags={['게임', '친목']}
              isHost={true}
              isMicAvailable={true}
              isPrivate={true}
            />
          </Component>
        </div>
      </section>

      <section id="realtime-rooms" className={styles.section}>
        <h2 className={styles.sectionTitle}>RealtimeRoomsSection</h2>
        <ComponentRelations componentId="realtime-rooms" />
        <div className={styles.showcaseBlock}>
          <Component fullWidth>
            <RealtimeRoomsSection />
          </Component>
        </div>
      </section>

      <section id="dialog" className={styles.section}>
        <h2 className={styles.sectionTitle}>Dialog</h2>
        <ComponentRelations componentId="dialog" />
        <div className={styles.showcaseBlock}>
          <Component>
            <TextButton.Primary modalId="dialog-example" text="Dialog 열기" size="medium" />
            <Modal id="dialog-example">
              <Dialog
                modalId="dialog-example"
                src={Paths.images('mascot_surprise')}
                title="정말 나가시겠습니까?"
                content="현재 진행 중인 대화 정보가 사라질 수 있으니 신중하게 결정해주세요!"
              />
            </Modal>
          </Component>
        </div>
      </section>
    </>
  );
}
