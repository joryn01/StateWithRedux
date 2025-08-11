import { configureStore, createSlice } from "@reduxjs/toolkit";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  Appbar,
  Avatar,
  Banner,
  Button,
  Card,
  Divider,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { Provider, useDispatch, useSelector } from "react-redux";

/********************
 * Todos slice
 ********************/
const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [] },
  reducers: {
    addTodo: (state, action) => {
      state.items.push({
        id: Date.now().toString(),
        title: action.payload,
        done: false,
        createdAt: new Date().toISOString(),
      });
    },
    toggleTodo: (state, action) => {
      const todo = state.items.find((t) => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
    removeTodo: (state, action) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    clearTodos: (state) => {
      state.items = [];
    },
  },
});

const { addTodo, toggleTodo, removeTodo, clearTodos } = todosSlice.actions;

/********************
 * UI slice: theme + banners
 ********************/
const uiSlice = createSlice({
  name: "ui",
  initialState: { darkMode: false, showBanner: true, showAddBanner: false },
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
    },
    dismissBanner(state) {
      state.showBanner = false;
    },
    showAddBanner(state) {
      state.showAddBanner = true;
    },
    hideAddBanner(state) {
      state.showAddBanner = false;
    },
  },
});

const { toggleDarkMode, dismissBanner, showAddBanner, hideAddBanner } = uiSlice.actions;

/********************
 * Store
 ********************/
const store = configureStore({
  reducer: {
    todos: todosSlice.reducer,
    ui: uiSlice.reducer,
  },
});

/********************
 * Dark mode switch
 ********************/
function DarkModeSwitch() {
  const dispatch = useDispatch();
  const darkMode = useSelector((s) => s.ui.darkMode);
  return <Switch value={darkMode} onValueChange={() => dispatch(toggleDarkMode())} />;
}

/********************
 * Todos card
 ********************/
function TodosCard() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.todos.items);
  const [title, setTitle] = useState("");
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 2 : 1;

  const addNewTodo = () => {
    if (!title.trim()) return;
    dispatch(addTodo(title.trim()));
    setTitle("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    dispatch(showAddBanner());
    setTimeout(() => dispatch(hideAddBanner()), 2000);
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Todos"
        subtitle="Responsive FlatList"
        left={(props) => <Avatar.Icon {...props} icon="check-circle-outline" />}
      />
      <Card.Content>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{ flex: 1 }}
            label="What needs doing?"
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={addNewTodo}
            returnKeyType="done"
          />
          <Button mode="contained" onPress={addNewTodo}>
            Add
          </Button>
        </View>
        <Divider style={{ marginVertical: 12 }} />

        <FlatList
          data={items}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Card style={{ flex: 1, marginRight: numColumns > 1 ? 8 : 0 }}>
              <Card.Title
                title={item.title}
                subtitle={new Date(item.createdAt).toLocaleString()}
                left={(props) => (
                  <Avatar.Icon {...props} icon={item.done ? "check" : "circle-outline"} />
                )}
              />
              <Card.Actions>
                <Button onPress={() => dispatch(toggleTodo(item.id))}>
                  {item.done ? "Undo" : "Done"}
                </Button>
                <Button onPress={() => dispatch(removeTodo(item.id))} textColor="#d11">
                  Remove
                </Button>
              </Card.Actions>
            </Card>
          )}
          ListEmptyComponent={<Text>No todos yet. Add one above.</Text>}
        />
        {items.length > 0 && (
          <Button style={{ marginTop: 8 }} onPress={() => dispatch(clearTodos())}>
            Clear All
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

/********************
 * App scaffold
 ********************/
function AppScaffold() {
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const showBannerState = useSelector((s) => s.ui.showBanner);
  const showAddBannerState = useSelector((s) => s.ui.showAddBanner);

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <Appbar.Header>
        <Appbar.Content title="Todos App" />
        <DarkModeSwitch />
      </Appbar.Header>

      {showBannerState && (
        <Banner
          visible
          actions={[{ label: "Got it", onPress: () => dispatch(dismissBanner()) }]}
          icon={({ size }) => <Avatar.Icon size={size} icon="information-outline" />}
        >
          This app lets you manage a todo list using Redux state.
        </Banner>
      )}

      {showAddBannerState && (
        <Banner
          visible
          style={{ backgroundColor: "#4caf50" }}
          icon={({ size }) => <Avatar.Icon size={size} icon="check" />}
        >
          New task added!
        </Banner>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[isTablet && styles.contentTablet, { paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.column, isTablet && styles.columnTablet]}>
          <TodosCard />
        </View>
      </ScrollView>
    </View>
  );
}

/********************
 * App root with theme
 ********************/
export default function App() {
  const darkMode = useSelectorFromStore((state) => state.ui.darkMode);

  const theme = darkMode ? MD3DarkTheme : MD3LightTheme;

  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <AppWithReduxTheme />
      </PaperProvider>
    </Provider>
  );
}

/********************
 * Hook to access store outside Provider
 ********************/
function useSelectorFromStore(selector) {
  const [value, setValue] = React.useState(selector(store.getState()));
  React.useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setValue(selector(store.getState()));
    });
    return unsubscribe;
  }, []);
  return value;
}

function AppWithReduxTheme() {
  return <AppScaffold />;
}

/********************
 * Styles
 ********************/
const styles = StyleSheet.create({
  container: { flex: 1 },
  containerTablet: { paddingHorizontal: 24 },
  content: { flex: 1 },
  contentTablet: { flexDirection: "row", gap: 24 },
  column: { flex: 1 },
  columnTablet: { maxWidth: 600 },
  card: { margin: 12 },
});
