import { useBasic, useQuery } from "@basictech/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import bgImage from "/bg2.jpg";
import "./App.css";
import AboutModal from "./components/AboutModal";
import AgendaView from "./components/AgendaView";
import DynamicIsland from "./components/DynamicIsland";
import FolderDrawer from "./components/FolderDrawer";
import FolderSettings from "./components/FolderSettings";
import FocusView from "./components/FocusView";
import FoldersBar from "./components/FoldersBar";
import IconSidebar from "./components/IconSidebar";
import ListItem from "./components/ListItem";
import MobileNavBar from "./components/MobileNavBar";
import ScheduleSidebar from "./components/ScheduleSidebar";
import SettingsPage from "./components/SettingsPage";
import SilkTaskDrawer from "./components/SilkTaskDrawer";
import UserAvatarButton from "./components/UserAvatarButton";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { useAppActions } from "./hooks/useAppActions";
import { readBasicDbSafely, useBasicDbReady } from "./hooks/useBasicDbReady";
import { useHomeKeyboardShortcuts } from "./hooks/useHomeKeyboardShortcuts";
import { useHomeUiState } from "./hooks/useHomeUiState";
import { useTaskCollections } from "./hooks/useTaskCollections";
import { ScheduleCardData } from "./utils/schedule";
import { Folder, Task } from "./utils/types";

function Home() {
  const { db } = useBasic();
  const isDbReady = useBasicDbReady();
  const { theme } = useTheme();

  const tasksData = useQuery(
    () => readBasicDbSafely(isDbReady, () => db.table<Task>("tasks").getAll(), Promise.resolve([] as Task[])),
    [isDbReady],
  );
  const scheduleEventsData = useQuery(
    () => readBasicDbSafely(
      isDbReady,
      () => db.table<ScheduleCardData>("schedule").getAll(),
      Promise.resolve([] as ScheduleCardData[]),
    ),
    [isDbReady],
  );
  const foldersData = useQuery(
    () => readBasicDbSafely(isDbReady, () => db.table<Folder>("filters").getAll(), Promise.resolve([] as Folder[])),
    [isDbReady],
  );

  const isCollectionsLoading =
    !isDbReady || tasksData === undefined || scheduleEventsData === undefined || foldersData === undefined;

  const tasks = useMemo(() => (tasksData ?? []) as Task[], [tasksData]);
  const scheduleEvents = useMemo(() => (scheduleEventsData ?? []) as ScheduleCardData[], [scheduleEventsData]);
  const folders = useMemo(() => (foldersData ?? []) as Folder[], [foldersData]);
  const [showDelayedLoadingState, setShowDelayedLoadingState] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleCardData | null>(null);

  const {
    activeFolder,
    aboutModalOpen,
    completedTasksExpanded,
    currentView,
    drawerOpen,
    folderDrawerOpen,
    folderSettingsOpen,
    hasSuggestedInitializedRef,
    islandMode,
    isMobile,
    isNewTaskMode,
    mobileView,
    scheduleViewMode,
    showAllFolder,
    showOtherFolder,
    showTodayFolder,
    suggestedTasksExpanded,
    viewMode,
    setActiveFolder,
    setAboutModalOpen,
    setCompletedTasksExpanded,
    setCurrentView,
    setDrawerOpen,
    setFolderDrawerOpen,
    setFolderSettingsOpen,
    setIslandMode,
    setIsNewTaskMode,
    setMobileView,
    setScheduleViewMode,
    setShowAllFolder,
    setShowOtherFolder,
    setShowTodayFolder,
    setSuggestedTasksExpanded,
    setViewMode,
  } = useHomeUiState();

  const {
    completedTasks,
    filteredTasks,
    suggestedTasks,
  } = useTaskCollections({
    activeFolder,
    folders,
    tasks,
    scheduleEvents,
    isCollectionsLoading,
    hasSuggestedInitializedRef,
    setSuggestedTasksExpanded,
  });

  useEffect(() => {
    if (!isCollectionsLoading) {
      setShowDelayedLoadingState(false);
      return;
    }

    // TODO(basic-sdk): replace this heuristic when the SDK exposes first-class
    // query loading / own-subscription readiness so apps don't have to infer it.
    const timer = window.setTimeout(() => {
      setShowDelayedLoadingState(true);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [isCollectionsLoading]);

  const {
    deleteScheduleEvent,
    deleteTask,
    focusedTask,
    handleAddEvent,
    handleAddSubtask,
    handleAddTask,
    handleAddToSchedule,
    handleCreateFolder,
    handleDeleteFolder,
    handleEnterFocus,
    handleExitFocus,
    handleFetchWeather,
    handleTaskToggle,
    handleUpdateFolder,
    openNewTaskDrawer,
    updateScheduleEvent,
    updateTask,
  } = useAppActions({
    activeFolder,
    folders,
    scheduleEvents,
    selectedTask,
    setActiveFolder,
    setDrawerOpen,
    setIsNewTaskMode,
    setSelectedEvent,
    setSelectedTask,
    themeLocation: theme.location,
  });

  const handleMobileViewChange = useCallback(
    (view: "tasks" | "calendar") => {
      setMobileView(view);
      if (drawerOpen) {
        setDrawerOpen(false);
        setIsNewTaskMode(false);
        setSelectedTask(null);
        setSelectedEvent(null);
      }
    },
    [drawerOpen, setDrawerOpen, setIsNewTaskMode, setMobileView],
  );

  const handleEventSelectWrapper = useCallback((event: ScheduleCardData | null) => {
    setSelectedEvent(event);
    setSelectedTask(null);
  }, []);

  const handleTaskSelect = useCallback(
    (task: Task) => {
      if (!task.id) {
        return;
      }

      setSelectedTask({ ...task });
      setSelectedEvent(null);
      setCurrentView("home");
      setIsNewTaskMode(false);

      if (isMobile) {
        setDrawerOpen(true);
      }
    },
    [isMobile, setCurrentView, setDrawerOpen, setIsNewTaskMode],
  );

  const handleTaskSelectWrapper = useCallback((task: Task | null) => {
    setSelectedTask(task);
    setSelectedEvent(null);
  }, []);

  const handleScheduleCardClick = useCallback(
    (cardData: ScheduleCardData) => {
      const isDeletedTask = cardData.type === "task" && !cardData.taskId && cardData.metadata?.taskSnapshot;

      if (isDeletedTask || cardData.type === "task:completed") {
        setSelectedEvent(cardData);
        setSelectedTask(null);
        setIsNewTaskMode(false);
        if (isMobile) {
          setDrawerOpen(true);
        }
        return;
      }

      if (cardData.type === "task" && cardData.taskId) {
        const task = tasks.find((item) => item.id === cardData.taskId);
        if (task) {
          setSelectedTask(task);
          setSelectedEvent(null);
          setIsNewTaskMode(false);
          if (isMobile) {
            setDrawerOpen(true);
          }
        }
        return;
      }

      if (cardData.type === "event" || cardData.type === "other") {
        setSelectedEvent(cardData);
        setSelectedTask(null);
        setIsNewTaskMode(false);
        if (isMobile) {
          setDrawerOpen(true);
        }
      }
    },
    [isMobile, setDrawerOpen, setIsNewTaskMode, tasks],
  );

  const handleOpenSettings = useCallback(() => setCurrentView("settings"), [setCurrentView]);
  const handleOpenAbout = useCallback(() => setAboutModalOpen(true), [setAboutModalOpen]);
  const handleFolderSelect = useCallback((folderId: string | null) => setActiveFolder(folderId), [setActiveFolder]);
  const handleOpenFolderSettings = useCallback(() => setFolderSettingsOpen(true), [setFolderSettingsOpen]);
  const handleFolderUpdateRequest = useCallback(
    (folderId: string, name: string, labels: string, color?: string) =>
      handleUpdateFolder(folderId, {
        name,
        labels,
        color,
      }),
    [handleUpdateFolder],
  );

  useHomeKeyboardShortcuts({
    activeFolder,
    filteredTasks,
    folders,
    handleEnterFocus,
    handleEventSelect: handleEventSelectWrapper,
    isMobile,
    islandMode,
    scheduleEvents,
    selectedEvent,
    selectedTask,
    setActiveFolder,
    setAboutModalOpen,
    setCurrentView,
    setDrawerOpen,
    setIslandMode,
    setSelectedEvent,
    setSelectedTask,
    showAllFolder,
    showOtherFolder,
    showTodayFolder,
  });

  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports("height", "100dvh")) {
      return;
    }

    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, []);

  return (
    <>
      {focusedTask && (
        <FocusView
          task={focusedTask}
          onExit={handleExitFocus}
          onUpdateTask={updateTask}
          onTaskToggle={handleTaskToggle}
          onAddSubtask={handleAddSubtask}
          onDeleteSubtask={deleteTask}
        />
      )}

      <div
        className="flex"
        style={{
          height:
            typeof CSS !== "undefined" && CSS.supports("height", "100dvh")
              ? "100dvh"
              : "calc(var(--vh, 1vh) * 100)",
          backgroundColor: theme.accentColor,
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4)), url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {!isMobile && (
          <IconSidebar
            onOpenSettings={handleOpenSettings}
            onOpenAbout={handleOpenAbout}
            currentView={currentView}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {currentView === "settings" && (
            <SettingsPage
              onBack={() => setCurrentView("home")}
              onViewModeChange={setViewMode}
              currentViewMode={viewMode}
              folders={folders}
              onCreateFolder={handleCreateFolder}
              onUpdateFolder={handleFolderUpdateRequest}
              onDeleteFolder={handleDeleteFolder}
              showAllFolder={showAllFolder}
              showOtherFolder={showOtherFolder}
              showTodayFolder={showTodayFolder}
              onToggleAllFolder={setShowAllFolder}
              onToggleOtherFolder={setShowOtherFolder}
              onToggleTodayFolder={setShowTodayFolder}
            />
          )}

          {currentView === "home" && (
            <section
              className={`flex-1 task-home w-full relative overflow-hidden ${theme.isDarkMode ? "text-gray-100" : "text-gray-900"} ${isMobile && drawerOpen ? "drawer-open-scale" : ""}`}
              style={{ paddingBottom: "env(safe-area-inset-bottom, 20px)" }}
            >
              {isMobile && (
                <div className="h-12 rounded-b-md flex justify-between items-center sticky top-0 z-100" style={{ backgroundColor: "transparent" }}>
                  <div>
                    <button
                      onClick={handleOpenAbout}
                      className="group ml-1 px-2 py-2 rounded-lg bg-transparent hover:bg-white/10 transition-colors duration-200 text-md flex items-center cursor-pointer"
                    >
                      <img className="w-6 h-6 mr-2" src="tsk-logo.png" />
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">tsk.</span>
                    </button>
                  </div>

                  <div className="flex-none flex items-center pr-2 gap-2">
                    <button
                      onClick={handleOpenSettings}
                      className="opacity-60 hover:opacity-100 focus:outline-none bg-transparent"
                      aria-label="Settings"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <UserAvatarButton />
                  </div>
                </div>
              )}

              <div className="flex flex-1" style={{ height: isMobile ? "calc(100% - 48px)" : "100%" }}>
                {(!isMobile || mobileView === "tasks") && (
                  <div className="flex-1 flex flex-col relative">
                    <FoldersBar
                      folders={folders}
                      activeFolder={activeFolder}
                      onFolderSelect={handleFolderSelect}
                      showAllFolder={showAllFolder}
                      showOtherFolder={showOtherFolder}
                      showTodayFolder={showTodayFolder}
                    />

                    <div
                      className="flex-1 overflow-y-auto px-1 md:px-4 relative tasks-scroll-container"
                      style={{
                        paddingBottom: isMobile
                          ? "8rem"
                          : typeof CSS !== "undefined" && CSS.supports("height", "100dvh")
                            ? "50dvh"
                            : "calc(var(--vh, 1vh) * 50)",
                      }}
                    >
                      <div className="mt-10 flex justify-center">
                        <div className="w-full max-w-2xl relative">
                          {showDelayedLoadingState && filteredTasks.length === 0 && (
                            <div className="task-loading-state" aria-live="polite" aria-busy="true">
                              <div className="task-loading-spinner" />
                            </div>
                          )}

                          {!isCollectionsLoading && filteredTasks.length === 0 && (
                            <div>
                              {activeFolder === "today" ? (
                                <>
                                  <p className={`text-lg font-bold text-center ${theme.isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                                    No Tasks scheduled for Today
                                  </p>
                                  <p className={`no-task-blurb text-sm font-serif text-center mt-2 ${theme.isDarkMode ? "text-slate-100" : "text-gray-700"}`}>
                                    which is <em>totally</em> fine. its okay to do nothing. you deserve a rest day.
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className={`text-lg font-bold text-center ${theme.isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                                    No tasks yet.
                                  </p>
                                  <p className={`no-task-blurb text-sm font-serif text-center ${theme.isDarkMode ? "text-slate-100" : "text-gray-700"}`}>
                                    which is <em>totally</em> fine. its okay to do nothing. you deserve a rest day.
                                  </p>
                                  <p className={`no-task-blurb text-sm font-serif text-center ${theme.isDarkMode ? "text-slate-100" : "text-gray-700"}`}>
                                    but also, you can add a task below.
                                  </p>
                                </>
                              )}
                            </div>
                          )}

                          <div className={`flex flex-col ${viewMode === "compact" ? "space-y-0" : viewMode === "cozy" ? "space-y-1" : "space-y-2"}`}>
                            {filteredTasks.map((task) => (
                              <div key={task.id} className="w-full">
                                <ListItem
                                  task={task}
                                  deleteTask={deleteTask}
                                  updateTask={updateTask}
                                  isSelected={selectedTask?.id === task.id}
                                  viewMode={viewMode}
                                  handleTaskSelect={handleTaskSelect}
                                  onEnterFocus={handleEnterFocus}
                                  onAddToSchedule={handleAddToSchedule}
                                  isMobile={isMobile}
                                />
                              </div>
                            ))}
                          </div>

                          {((activeFolder === "today" && suggestedTasks.length > 0) || completedTasks.length > 0) && (
                            <div className={`mt-8 ${filteredTasks.length > 0 ? "pt-8" : ""}`}>
                              <div className="flex items-center gap-4 mb-4">
                                {activeFolder === "today" && suggestedTasks.length > 0 && (
                                  <button
                                    onClick={() => {
                                      setSuggestedTasksExpanded((current) => !current);
                                      if (!suggestedTasksExpanded) {
                                        setCompletedTasksExpanded(false);
                                      }
                                    }}
                                    className={`flex items-center gap-1.5 ${theme.isDarkMode ? "text-gray-300 hover:text-gray-100" : "text-gray-700 hover:text-gray-900"} transition-colors`}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className={`h-3.5 w-3.5 transition-transform ${suggestedTasksExpanded ? "rotate-90" : ""}`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="text-sm font-medium">Suggested</span>
                                    <span className={`text-xs font-medium ${theme.isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                      ({suggestedTasks.length})
                                    </span>
                                  </button>
                                )}

                                {completedTasks.length > 0 && (
                                  <button
                                    onClick={() => {
                                      setCompletedTasksExpanded((current) => !current);
                                      if (!completedTasksExpanded) {
                                        setSuggestedTasksExpanded(false);
                                      }
                                    }}
                                    className={`flex items-center gap-1.5 ${theme.isDarkMode ? "text-gray-300 hover:text-gray-100" : "text-gray-700 hover:text-gray-900"} transition-colors`}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className={`h-3.5 w-3.5 transition-transform ${completedTasksExpanded ? "rotate-90" : ""}`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="text-sm font-medium">Completed</span>
                                    <span className={`text-xs font-medium ${theme.isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                      ({completedTasks.length})
                                    </span>
                                  </button>
                                )}
                              </div>

                              {activeFolder === "today" && suggestedTasks.length > 0 && suggestedTasksExpanded && (
                                <div className={`flex flex-col mb-4 ${viewMode === "compact" ? "space-y-0" : viewMode === "cozy" ? "space-y-1" : "space-y-2"}`}>
                                  {suggestedTasks.map((task) => (
                                    <div key={task.id} className="w-full" onClick={() => handleTaskSelect(task)}>
                                      <ListItem
                                        task={task}
                                        deleteTask={deleteTask}
                                        updateTask={updateTask}
                                        isSelected={selectedTask?.id === task.id}
                                        viewMode={viewMode}
                                        handleTaskSelect={handleTaskSelect}
                                        onEnterFocus={handleEnterFocus}
                                        onAddToSchedule={handleAddToSchedule}
                                        isSuggested
                                        isMobile={isMobile}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {completedTasksExpanded && (
                                <div className={`flex flex-col ${viewMode === "compact" ? "space-y-0" : viewMode === "cozy" ? "space-y-1" : "space-y-2"}`}>
                                  {completedTasks.map((task) => (
                                    <div key={task.id} className="w-full" onClick={() => handleTaskSelect(task)}>
                                      <ListItem
                                        task={task}
                                        deleteTask={deleteTask}
                                        updateTask={updateTask}
                                        isSelected={selectedTask?.id === task.id}
                                        viewMode={viewMode}
                                        handleTaskSelect={handleTaskSelect}
                                        onEnterFocus={handleEnterFocus}
                                        onAddToSchedule={handleAddToSchedule}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isMobile && mobileView === "calendar" && (
                  <div className="flex-1 h-full overflow-hidden px-1 relative">
                    {scheduleViewMode === "timeline" ? (
                      <ScheduleSidebar
                        onCardClick={handleScheduleCardClick}
                        events={scheduleEvents}
                        onUpdateEvent={updateScheduleEvent}
                        onDeleteEvent={deleteScheduleEvent}
                        onTaskToggle={handleTaskToggle}
                        onAddEvent={handleAddEvent}
                        viewMode={scheduleViewMode}
                        onViewModeChange={setScheduleViewMode}
                        location={theme.location}
                        onFetchWeather={handleFetchWeather}
                        folders={folders}
                      />
                    ) : (
                      <AgendaView
                        onCardClick={handleScheduleCardClick}
                        events={scheduleEvents}
                        onTaskToggle={handleTaskToggle}
                        viewMode={scheduleViewMode}
                        onViewModeChange={setScheduleViewMode}
                        location={theme.location}
                        onFetchWeather={handleFetchWeather}
                        folders={folders}
                      />
                    )}
                  </div>
                )}

                {!isMobile && (
                  <div className="hidden md:block md:pl-4 w-[480px] p-2">
                    {scheduleViewMode === "timeline" ? (
                      <ScheduleSidebar
                        onCardClick={handleScheduleCardClick}
                        events={scheduleEvents}
                        onUpdateEvent={updateScheduleEvent}
                        onDeleteEvent={deleteScheduleEvent}
                        onTaskToggle={handleTaskToggle}
                        onAddEvent={handleAddEvent}
                        viewMode={scheduleViewMode}
                        onViewModeChange={setScheduleViewMode}
                        location={theme.location}
                        onFetchWeather={handleFetchWeather}
                        folders={folders}
                      />
                    ) : (
                      <AgendaView
                        onCardClick={handleScheduleCardClick}
                        events={scheduleEvents}
                        onTaskToggle={handleTaskToggle}
                        viewMode={scheduleViewMode}
                        onViewModeChange={setScheduleViewMode}
                        location={theme.location}
                        onFetchWeather={handleFetchWeather}
                        folders={folders}
                      />
                    )}
                  </div>
                )}
              </div>

              {!isMobile && (
                <DynamicIsland
                  selectedTask={selectedTask}
                  selectedEvent={selectedEvent}
                  onTaskSelect={handleTaskSelectWrapper}
                  onEventSelect={handleEventSelectWrapper}
                  onAddTask={handleAddTask}
                  onAddEvent={handleAddEvent}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  onUpdateEvent={updateScheduleEvent}
                  onDeleteEvent={deleteScheduleEvent}
                  onAddToSchedule={handleAddToSchedule}
                  onAddSubtask={handleAddSubtask}
                  onEnterFocus={handleEnterFocus}
                  tasks={tasks}
                  folders={folders}
                  activeFolder={activeFolder}
                  onFolderSelect={handleFolderSelect}
                  showAllFolder={showAllFolder}
                  showOtherFolder={showOtherFolder}
                  showTodayFolder={showTodayFolder}
                  mode={islandMode}
                  onModeChange={setIslandMode}
                  onOpenSettings={handleOpenSettings}
                  onToggleView={() => setScheduleViewMode((current) => (current === "agenda" ? "timeline" : "agenda"))}
                  currentView={scheduleViewMode}
                />
              )}

              {isMobile && (
                <SilkTaskDrawer
                  isOpen={drawerOpen}
                  setIsOpen={setDrawerOpen}
                  task={selectedTask}
                  event={selectedEvent}
                  updateFunction={updateTask}
                  deleteTask={deleteTask}
                  isNewTaskMode={isNewTaskMode}
                  currentView={mobileView}
                  onAddTask={handleAddTask}
                  onAddToSchedule={handleAddToSchedule}
                  onUpdateEvent={updateScheduleEvent}
                  onDeleteEvent={deleteScheduleEvent}
                  onAddEvent={handleAddEvent}
                  onAddSubtask={handleAddSubtask}
                  onUpdateSubtask={updateTask}
                  onDeleteSubtask={deleteTask}
                  onTaskSelect={handleTaskSelect}
                  onEnterFocus={handleEnterFocus}
                  folders={folders}
                />
              )}

              <AboutModal
                isOpen={aboutModalOpen}
                setIsOpen={setAboutModalOpen}
                currentAccentColor={theme.accentColor}
                isDarkMode={theme.isDarkMode}
              />

              {isMobile && (
                <>
                  <MobileNavBar currentView={mobileView} onViewChange={handleMobileViewChange} onCreateNew={openNewTaskDrawer} />

                  {mobileView === "tasks" && (
                    <div
                      className="fixed bottom-0 left-0 z-50 md:hidden"
                      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
                    >
                      <div className="flex px-6 mb-2">
                        <div
                          className="flex items-center justify-center px-2 py-2 rounded-full backdrop-blur-3xl shadow-lg border"
                          style={{
                            backgroundColor: `${theme.accentColor}E6`,
                            borderColor: theme.isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                          }}
                        >
                          <button
                            onClick={() => setFolderDrawerOpen(true)}
                            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
                              theme.isDarkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
                            }`}
                            aria-label="Folders"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {isMobile && (
                <FolderDrawer
                  isOpen={folderDrawerOpen}
                  setIsOpen={setFolderDrawerOpen}
                  folders={folders}
                  activeFolder={activeFolder}
                  onFolderSelect={handleFolderSelect}
                  onOpenSettings={handleOpenFolderSettings}
                  showAllFolder={showAllFolder}
                  showOtherFolder={showOtherFolder}
                  showTodayFolder={showTodayFolder}
                  isDarkMode={theme.isDarkMode}
                  accentColor={theme.accentColor}
                />
              )}

              {isMobile && (
                <FolderSettings
                  isOpen={folderSettingsOpen}
                  setIsOpen={setFolderSettingsOpen}
                  folders={folders}
                  onCreateFolder={handleCreateFolder}
                  onUpdateFolder={handleFolderUpdateRequest}
                  onDeleteFolder={handleDeleteFolder}
                  showAllFolder={showAllFolder}
                  showOtherFolder={showOtherFolder}
                  showTodayFolder={showTodayFolder}
                  onToggleAllFolder={setShowAllFolder}
                  onToggleOtherFolder={setShowOtherFolder}
                  onToggleTodayFolder={setShowTodayFolder}
                  isDarkMode={theme.isDarkMode}
                  accentColor={theme.accentColor}
                />
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <Home />
      </div>
    </ThemeProvider>
  );
}

export default App;
