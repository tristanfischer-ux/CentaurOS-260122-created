import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
    Zap,
    Target,
    BarChart3,
    Lightbulb,
    ArrowRight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function EssentialToolsSection() {
    const router = useRouter();

    const tools = [
        {
            title: 'Decision Armory',
            description: 'The strategy hub for all key decisions',
            icon: Target,
            color: '#7c3aed',
            route: '/decide' as const,
        },
        {
            title: 'Resource What',
            description: 'Manage task allocations and capacity',
            icon: Zap,
            color: '#10b981',
            route: '/(tabs)/what' as const,
        }
    ];

    return (
        <View className="mt-8">
            <View className="flex-row items-center justify-between mb-4">
                <Text className="text-slate-900 dark:text-white text-lg font-bold">
                    Essential Tools
                </Text>
            </View>

            <View className="flex-row gap-4">
                {tools.map((tool, index) => (
                    <Pressable
                        key={index}
                        onPress={() => router.push(tool.route)}
                        className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <View
                            className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                            style={{ backgroundColor: `${tool.color}15` }}
                        >
                            <tool.icon size={20} color={tool.color} />
                        </View>
                        <Text className="text-slate-900 dark:text-white font-bold text-sm mb-1">
                            {tool.title}
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed" numberOfLines={2}>
                            {tool.description}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}
