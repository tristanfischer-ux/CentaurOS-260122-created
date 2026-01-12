import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { CheckCircle2, Clock, AlertCircle, ArrowLeft } from "lucide-react-native";
import { useCurrentWorkspace } from "@/lib/state/app-store";
import { useDashboardStats, useTasks } from "@/lib/hooks/queries";

export default function KPIDetailsScreen() {
  const { type } = useLocalSearchParams<{ type: "completed" | "in_progress" }>();
  const currentWorkspace = useCurrentWorkspace();
  const { data: stats, isLoading } = useDashboardStats(
    currentWorkspace?.id ?? null
  );
  const { data: allTasks, isLoading: tasksLoading } = useTasks(
    currentWorkspace?.id ?? null
  );

  if (isLoading || tasksLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <Stack.Screen
          options={{
            title: "Loading...",
            headerStyle: { backgroundColor: "#020617" },
            headerTintColor: "#fff",
            headerShadowVisible: false,
          }}
        />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Filter tasks based on type
  const getTasks = () => {
    if (!allTasks) return [];

    if (type === "completed") {
      // Get tasks completed this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return allTasks.filter(
        (task: any) =>
          task.status === "done" &&
          task.completedAt &&
          new Date(task.completedAt) >= oneWeekAgo
      );
    }

    if (type === "in_progress") {
      return allTasks.filter((task: any) => task.status === "in_progress");
    }

    return [];
  };

  const tasks = getTasks();

  const title =
    type === "completed"
      ? "Completed This Week"
      : type === "in_progress"
        ? "Tasks In Progress"
        : "Tasks";

  const icon =
    type === "completed" ? (
      <CheckCircle2 size={24} color="#10b981" />
    ) : (
      <Clock size={24} color="#3b82f6" />
    );

  const emptyMessage =
    type === "completed"
      ? "No tasks completed this week"
      : "No tasks currently in progress";

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <Stack.Screen
        options={{
          title,
          headerStyle: { backgroundColor: "#020617" },
          headerTintColor: "#fff",
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              className="active:opacity-70 mr-4"
            >
              <ArrowLeft size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <View className="flex-row items-center gap-3 mb-2">
            {icon}
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">{title}</Text>
          </View>
          <Text className="text-gray-600 dark:text-slate-400 text-sm">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"} found
          </Text>
        </View>

        {/* Tasks List */}
        <View className="px-6 pb-6">
          {tasks.length === 0 ? (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-8 border border-slate-800 items-center">
              <AlertCircle size={48} color="#64748b" />
              <Text className="text-gray-600 dark:text-slate-400 text-center mt-4">
                {emptyMessage}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {tasks.map((task: any) => {
                const priorityColor =
                  task.priority === "urgent"
                    ? "bg-red-500"
                    : task.priority === "high"
                      ? "bg-orange-500"
                      : task.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-slate-500";

                const statusIcon =
                  task.status === "done" ? (
                    <CheckCircle2 size={20} color="#10b981" />
                  ) : task.status === "in_progress" ? (
                    <Clock size={20} color="#3b82f6" />
                  ) : null;

                return (
                  <Pressable
                    key={task.id}
                    onPress={() => router.push("/work")}
                    className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-white font-semibold text-base mb-1">
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                            {task.description}
                          </Text>
                        )}
                      </View>
                      {statusIcon}
                    </View>

                    {/* Task Meta */}
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <View
                        className={`w-2 h-2 rounded-full ${priorityColor}`}
                      />
                      <Text className="text-gray-600 dark:text-slate-400 text-xs capitalize">
                        {task.function || "General"}
                      </Text>
                      {task.assignee && (
                        <>
                          <Text className="text-slate-600">•</Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-xs">
                            {task.assignee.name}
                          </Text>
                        </>
                      )}
                      {task.dueDate && (
                        <>
                          <Text className="text-slate-600">•</Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-xs">
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </Text>
                        </>
                      )}
                      {type === "completed" && task.completedAt && (
                        <>
                          <Text className="text-slate-600">•</Text>
                          <Text className="text-emerald-400 text-xs">
                            Completed{" "}
                            {new Date(task.completedAt).toLocaleDateString()}
                          </Text>
                        </>
                      )}
                    </View>

                    {/* Linked Objective/KR if available */}
                    {task.objectiveId && (
                      <View className="mt-2 bg-blue-500/10 px-2 py-1 rounded-lg self-start">
                        <Text className="text-blue-400 text-xs">
                          Linked to Objective
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
