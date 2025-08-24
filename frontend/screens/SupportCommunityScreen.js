import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import api, { editReply, deleteReply } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function SupportCommunityScreen() {
  const [threads, setThreads] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingThread, setEditingThread] = useState(null);
  const { user } = useContext(AuthContext);
  const [replyInputs, setReplyInputs] = useState({}); // { [threadId]: replyText }
  const [replyLoading, setReplyLoading] = useState({}); // { [threadId]: boolean }
  const [editingReply, setEditingReply] = useState({}); // { [replyId]: { threadId, body } }
  const [replyEditInputs, setReplyEditInputs] = useState({}); // { [replyId]: body }
  const [replyEditLoading, setReplyEditLoading] = useState({}); // { [replyId]: boolean }
  // UI state for tabs, search, sorting and per-thread expansion
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'yours'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'mostReplies'
  const [expandedThreads, setExpandedThreads] = useState({}); // { [threadId]: boolean }

  const processThreadData = (thread) => ({
    id: String(thread.id), // do not fallback to Date.now()
    userId: String(thread.userId || ''),
    title: String(thread.title || ''),
    body: String(thread.body || ''),
    createdAt: thread.createdAt || new Date().toISOString(),
    replies: Array.isArray(thread.replies) ? thread.replies : [],
    createdBy: thread.createdBy || '',
  });

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const res = await api.get('/community');
      const data = Array.isArray(res?.data) ? res.data : [];
      const processedThreads = data
        .map(processThreadData)
        .filter(thread => thread.id && thread.title);
      setThreads(processedThreads);
    } catch (err) {
      console.error(err);
      setThreads([]);
    }
  };

  const addThread = async () => {
    if (!title || !body || !user) return;
    const newThread = {
      userId: user.email,
      title: title.trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
    };
    try {
      const res = await api.post('/community', newThread);
      const created = res.data?.thread || newThread;
      setThreads(prevThreads => [processThreadData(created), ...prevThreads]);
      resetForm();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create thread');
    }
  };

  const startEditing = (thread) => {
    setEditingThread(thread);
    setTitle(thread.title);
    setBody(thread.body);
    setIsCreating(true);
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setIsCreating(false);
    setEditingThread(null);
  };

  const updateThread = async () => {
    if (!editingThread || !title || !body) return;
    const updatedThread = {
      id: editingThread.id,
      userId: user.email,
      title: title.trim(),
      body: body.trim(),
    };
    try {
      const res = await api.put('/community', updatedThread);
      const updated = res.data?.thread || updatedThread;
      setThreads(prevThreads =>
        prevThreads.map(thread =>
          thread.id === editingThread.id ? processThreadData(updated) : thread
        )
      );
      resetForm();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update thread');
    }
  };

  const deleteThread = async (thread) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this thread?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/community', { data: { id: thread.id, userId: user.email } });
              setThreads(prevThreads =>
                prevThreads.filter(t => t.id !== thread.id)
              );
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete thread');
            }
          }
        }
      ]
    );
  };

  // Add reply to a thread
  const addReply = async (threadId) => {
    const replyText = replyInputs[threadId]?.trim();
    if (!replyText || !user) return;
    setReplyLoading(prev => ({ ...prev, [threadId]: true }));
    try {
      const res = await api.patch('/community', {
        threadId,
        userId: user.email,
        body: replyText,
      });
      const reply = res.data?.reply;
      setThreads(prevThreads => prevThreads.map(thread => {
        if (thread.id === threadId) {
          return {
            ...thread,
            replies: [...thread.replies, reply],
          };
        }
        return thread;
      }));
      setReplyInputs(prev => ({ ...prev, [threadId]: '' }));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add reply');
    } finally {
      setReplyLoading(prev => ({ ...prev, [threadId]: false }));
    }
  };

  // Edit reply handler
  const startEditingReply = (threadId, reply) => {
    setEditingReply({ [reply.replyId]: { threadId, body: reply.body } });
    setReplyEditInputs({ [reply.replyId]: reply.body });
  };
  const cancelEditingReply = (replyId) => {
    setEditingReply({});
    setReplyEditInputs(prev => ({ ...prev, [replyId]: '' }));
  };
  const handleEditReply = async (threadId, replyId) => {
    const body = replyEditInputs[replyId]?.trim();
    if (!body || !user) return;
    setReplyEditLoading(prev => ({ ...prev, [replyId]: true }));
    try {
      const res = await editReply({ threadId, replyId, userId: user.email, body });
      setThreads(prevThreads => prevThreads.map(thread => {
        if (thread.id === threadId) {
          return {
            ...thread,
            replies: thread.replies.map(r =>
              r.replyId === replyId ? { ...r, body: res.reply.body, editedAt: res.reply.editedAt } : r
            ),
          };
        }
        return thread;
      }));
      setEditingReply({});
      setReplyEditInputs({});
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to edit reply');
    } finally {
      setReplyEditLoading(prev => ({ ...prev, [replyId]: false }));
    }
  };
  // Delete reply handler
  const handleDeleteReply = (threadId, replyId) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setReplyEditLoading(prev => ({ ...prev, [replyId]: true }));
            try {
              await deleteReply({ threadId, replyId, userId: user.email });
              setThreads(prevThreads => prevThreads.map(thread => {
                if (thread.id === threadId) {
                  return {
                    ...thread,
                    replies: thread.replies.filter(r => r.replyId !== replyId),
                  };
                }
                return thread;
              }));
              setEditingReply({});
              setReplyEditInputs({});
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete reply');
            } finally {
              setReplyEditLoading(prev => ({ ...prev, [replyId]: false }));
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Derived data for UI
  const totalDiscussionsCount = threads.length;
  const yourDiscussionsCount = useMemo(
    () => threads.filter(t => t.userId === user?.email).length,
    [threads, user?.email]
  );

  const displayedThreads = useMemo(() => {
    const lower = searchQuery.trim().toLowerCase();
    let list = threads;
    if (activeTab === 'yours') {
      list = list.filter(t => t.userId === user?.email);
    }
    if (lower) {
      list = list.filter(t => t.title.toLowerCase().includes(lower) || t.body.toLowerCase().includes(lower));
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (b.replies?.length || 0) - (a.replies?.length || 0);
    });
    return list;
  }, [threads, activeTab, searchQuery, sortBy, user?.email]);

  const toggleExpanded = (threadId) => {
    setExpandedThreads(prev => ({ ...prev, [threadId]: !prev[threadId] }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Support & Community</Text>

      {/* Tabs row */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('all')}
          style={[styles.tabPill, activeTab === 'all' && styles.tabPillActive]}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>DISCUSSIONS</Text>
          <View style={[styles.countBadge, activeTab === 'all' && styles.countBadgeActive]}>
            <Text style={styles.countBadgeText}>{totalDiscussionsCount}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('yours')}
          style={[styles.tabPill, activeTab === 'yours' && styles.tabPillActive]}
        >
          <Text style={[styles.tabText, activeTab === 'yours' && styles.tabTextActive]}>YOURS</Text>
          <View style={[styles.countBadge, activeTab === 'yours' && styles.countBadgeActive]}>
            <Text style={styles.countBadgeText}>{yourDiscussionsCount}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search + Sort row */}
      <View style={styles.searchSortRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search discussions"
          placeholderTextColor="#b9c8d6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.sortPillsRow}>
          <TouchableOpacity
            onPress={() => setSortBy('newest')}
            style={[styles.sortPill, sortBy === 'newest' && styles.sortPillActive]}
          >
            <Text style={[styles.sortPillText, sortBy === 'newest' && styles.sortPillTextActive]}>Newest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy('mostReplies')}
            style={[styles.sortPill, sortBy === 'mostReplies' && styles.sortPillActive]}
          >
            <Text style={[styles.sortPillText, sortBy === 'mostReplies' && styles.sortPillTextActive]}>Most Replies</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isCreating ? (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsCreating(true)}
        >
          <Text style={styles.createButtonText}>Start New Discussion</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {editingThread ? 'Edit Discussion' : 'Start New Discussion'}
          </Text>
          <TextInput
            style={[styles.input, styles.titleInput]}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#666"
          />
          <TextInput
            style={[styles.input, styles.bodyInput]}
            placeholder="Share your thoughts..."
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            placeholderTextColor="#666"
          />
          <View style={styles.buttonContainer}>
            {editingThread ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.updateButton]}
                  onPress={updateThread}
                >
                  <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={resetForm}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.postButton]}
                  onPress={addThread}
                >
                  <Text style={styles.buttonText}>Post</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsCreating(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      <FlatList
        style={styles.list}
        data={displayedThreads}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.threadCard}>
            <View style={styles.threadHeader}>
              <View style={styles.threadMeta}>
                <Text style={styles.threadDate}>
                  {formatDate(item.createdAt)}
                </Text>
                {item.userId === user?.email && (
                  <View style={styles.threadActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => startEditing(item)}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteThread(item)}
                    >
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={styles.threadTitle}>{item.title}</Text>
              <Text style={styles.threadBody}>{item.body}</Text>
              <Text style={{ color: '#cfe0ee', fontSize: 12, marginTop: 4 }}>
                {item.createdBy || (item.userId ? `Created by: ${item.userId}` : 'Created by: Unknown')}
              </Text>
            </View>
            {/* Collapsible toggle */}
            <TouchableOpacity style={styles.threadFooter} onPress={() => toggleExpanded(item.id)}>
              <View style={styles.replyToggleRow}>
                <Text style={styles.replyCount}>
                  {item.replies.length} {item.replies.length === 1 ? 'reply' : 'replies'}
                </Text>
                <MaterialIcons name={expandedThreads[item.id] ? 'expand-less' : 'expand-more'} size={20} color="#cfe0ee" />
              </View>
            </TouchableOpacity>
            {expandedThreads[item.id] && (
              <View style={{ marginTop: 8 }}>
                {item.replies.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    {item.replies.map((reply) => (
                      <View key={reply.replyId} style={styles.replyCard}>
                        {editingReply[reply.replyId] ? (
                          <View style={styles.replyEditRow}>
                            <TextInput
                              style={styles.replyEditInput}
                              value={replyEditInputs[reply.replyId]}
                              onChangeText={text => setReplyEditInputs(prev => ({ ...prev, [reply.replyId]: text }))}
                              editable={!replyEditLoading[reply.replyId]}
                              placeholder="Edit your reply..."
                              placeholderTextColor="#88a2b6"
                            />
                            <TouchableOpacity
                              style={[styles.replyActionButton, styles.replySaveButton]}
                              onPress={() => handleEditReply(item.id, reply.replyId)}
                              disabled={replyEditLoading[reply.replyId] || !(replyEditInputs[reply.replyId]?.trim())}
                            >
                              <MaterialIcons name="check" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.replyActionButton, styles.replyCancelButton]}
                              onPress={() => cancelEditingReply(reply.replyId)}
                              disabled={replyEditLoading[reply.replyId]}
                            >
                              <MaterialIcons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <>
                            <View
                              style={[
                                styles.replyBodyRow,
                                reply.userId !== user?.email && { marginBottom: 8 },
                              ]}
                            >
                              <Text style={styles.replyBody}>{reply.body}</Text>
                              {reply.userId === user?.email && (
                                <View style={styles.replyActionsRow}>
                                  <TouchableOpacity
                                    style={[styles.replyActionButton, styles.replyEditButton]}
                                    onPress={() => startEditingReply(item.id, reply)}
                                    disabled={replyEditLoading[reply.replyId]}
                                  >
                                    <MaterialIcons name="edit" size={18} color="#fff" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.replyActionButton, styles.replyDeleteButton]}
                                    onPress={() => handleDeleteReply(item.id, reply.replyId)}
                                    disabled={replyEditLoading[reply.replyId]}
                                  >
                                    <MaterialIcons name="delete" size={18} color="#fff" />
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                            <View style={styles.replyMetaRow}>
                              <Text style={styles.replyUser}>{reply.userId}</Text>
                              <Text style={styles.replyDot}>·</Text>
                              <Text style={styles.replyDate}>{formatDate(reply.createdAt)}{reply.editedAt ? ' (edited)' : ''}</Text>
                            </View>
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                {/* Add Reply Form */}
                <View style={styles.replyInputContainer}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Write a reply..."
                    value={replyInputs[item.id] || ''}
                    onChangeText={text => setReplyInputs(prev => ({ ...prev, [item.id]: text }))}
                    editable={!replyLoading[item.id]}
                    placeholderTextColor="#88a2b6"
                  />
                  <TouchableOpacity
                    style={styles.replyButton}
                    onPress={async () => {
                      await addReply(item.id);
                      setExpandedThreads(prev => ({ ...prev, [item.id]: true }));
                    }}
                    disabled={replyLoading[item.id] || !(replyInputs[item.id]?.trim())}
                  >
                    <Text style={styles.replyButtonText}>{replyLoading[item.id] ? '...' : 'Reply'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 8, // Reduced top padding for closer spacing to nav bar
    backgroundColor: '#17384a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#ffffff',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#204d63',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabPillActive: {
    backgroundColor: '#243a73',
  },
  tabText: {
    color: '#cfe0ee',
    fontWeight: '700',
    fontSize: 12,
    marginRight: 8,
    letterSpacing: 0.4,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  countBadge: {
    backgroundColor: '#0d3043',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeActive: {
    backgroundColor: '#0f1c5a',
  },
  countBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  searchSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1f4a62',
    color: '#e9f2f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2a5f7b',
  },
  sortPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortPill: {
    backgroundColor: '#273b59',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  sortPillActive: {
    backgroundColor: '#2f3dbd',
  },
  sortPillText: {
    color: '#cfe0ee',
    fontWeight: '600',
    fontSize: 12,
  },
  sortPillTextActive: {
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#133142',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#1f4a62',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a5f7b',
    color: '#e9f2f9',
    marginBottom: 8,
  },
  titleInput: {
    fontWeight: '500',
  },
  bodyInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButton: {
    backgroundColor: '#3B82F6',
  },
  updateButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#546E7A',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  threadCard: {
    backgroundColor: '#0f2a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  threadHeader: {
    gap: 8,
  },
  threadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadDate: {
    color: '#cfe0ee',
    fontSize: 14,
  },
  threadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  threadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  threadBody: {
    fontSize: 16,
    color: '#dbe8f1',
    lineHeight: 22,
  },
  threadFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#224459',
  },
  replyToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyCount: {
    color: '#cfe0ee',
    fontSize: 14,
  },
  replyCard: {
    backgroundColor: '#14384c',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  replyBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    // marginBottom will be applied conditionally inline
  },
  replyBody: {
    fontSize: 15,
    color: '#e6f0f6',
    flex: 1,
    marginRight: 8,
    marginBottom: 0, // remove any bottom margin
  },
  replyEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  replyEditInput: {
    flex: 1,
    backgroundColor: '#1f4a62',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a5f7b',
    padding: 8,
    fontSize: 15,
    color: '#e9f2f9',
  },
  replyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  replyActionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyEditButton: {
    backgroundColor: '#3B82F6',
  },
  replyDeleteButton: {
    backgroundColor: '#f44336',
  },
  replySaveButton: {
    backgroundColor: '#4CAF50',
  },
  replyCancelButton: {
    backgroundColor: '#9e9e9e',
  },
  replyActionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  replyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2, // slight space above meta
    marginBottom: 0,
    gap: 6,
  },
  replyUser: {
    color: '#7cc4ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  replyDot: {
    color: '#88a2b6',
    fontSize: 14,
    marginHorizontal: 2,
    fontWeight: 'bold',
  },
  replyDate: {
    color: '#88a2b6',
    fontSize: 12,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#1f4a62',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a5f7b',
    padding: 8,
    fontSize: 15,
    color: '#e9f2f9',
  },
  replyButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  replyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});