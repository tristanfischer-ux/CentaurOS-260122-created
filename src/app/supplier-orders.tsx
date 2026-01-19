import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Package, DollarSign, Calendar, Truck, FileText, X, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SupplierOrder {
  id: string;
  supplierName: string;
  partName: string;
  description: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  currency: string;
  status: 'quote-requested' | 'quoted' | 'ordered' | 'in-production' | 'quality-check' | 'delivered';
  requestedBy: string;
  requestedAt: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
}

// Demo orders
const DEMO_ORDERS: SupplierOrder[] = [
  {
    id: 'ord-1',
    supplierName: 'Acme Manufacturing Ltd',
    partName: 'Custom PCB Boards',
    description: '4-layer PCB with gold plating, 100x80mm',
    quantity: 500,
    unitCost: 12.50,
    totalCost: 6250,
    currency: 'GBP',
    status: 'in-production',
    requestedBy: 'John Smith',
    requestedAt: '2026-01-05',
    expectedDeliveryDate: '2026-02-15',
  },
  {
    id: 'ord-2',
    supplierName: 'Precision Plastics UK',
    partName: 'Injection Molded Enclosure',
    description: 'ABS plastic housing, matte black finish',
    quantity: 1000,
    unitCost: 3.20,
    totalCost: 3200,
    currency: 'GBP',
    status: 'ordered',
    requestedBy: 'Sarah Mitchell',
    requestedAt: '2026-01-10',
    expectedDeliveryDate: '2026-02-20',
  },
  {
    id: 'ord-3',
    supplierName: 'TechAssembly Services',
    partName: 'Final Assembly',
    description: 'Full product assembly and QC testing',
    quantity: 500,
    unitCost: 8.00,
    totalCost: 4000,
    currency: 'GBP',
    status: 'quote-requested',
    requestedBy: 'John Smith',
    requestedAt: '2026-01-12',
  },
  {
    id: 'ord-4',
    supplierName: 'MetalWorks Solutions',
    partName: 'Aluminum Heatsinks',
    description: 'CNC machined aluminum, anodized finish',
    quantity: 1000,
    unitCost: 2.80,
    totalCost: 2800,
    currency: 'GBP',
    status: 'delivered',
    requestedBy: 'Marcus Rodriguez',
    requestedAt: '2025-12-15',
    expectedDeliveryDate: '2026-01-10',
    actualDeliveryDate: '2026-01-08',
  },
];

export default function SupplierOrdersScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ supplierId?: string; supplierName?: string }>();

  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const orders = params.supplierId
    ? DEMO_ORDERS.filter(o => o.supplierName === params.supplierName)
    : DEMO_ORDERS;

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quote-requested':
        return 'bg-blue-500/20 text-blue-500';
      case 'quoted':
        return 'bg-purple-500/20 text-purple-500';
      case 'ordered':
        return 'bg-amber-500/20 text-amber-500';
      case 'in-production':
        return 'bg-orange-500/20 text-orange-500';
      case 'quality-check':
        return 'bg-cyan-500/20 text-cyan-500';
      case 'delivered':
        return 'bg-emerald-500/20 text-emerald-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const totalSpend = filteredOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-700">
        <View className="flex-row items-center mb-3">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 active:opacity-70"
          >
            <ArrowLeft size={24} color="#3b82f6" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-xl font-bold">
              {params.supplierName || 'Supplier Orders'}
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowCreateModal(true)}
            className="bg-blue-500 p-2 rounded-lg active:opacity-70"
          >
            <Plus size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Stats Card */}
        <View className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-3">
          <Text className="text-emerald-900 dark:text-emerald-100 text-sm font-medium mb-1">
            Total Manufacturing Spend
          </Text>
          <Text className="text-emerald-900 dark:text-emerald-100 text-2xl font-bold">
            £{totalSpend.toLocaleString()}
          </Text>
        </View>

        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'quote-requested', label: 'Quote Req.' },
            { value: 'ordered', label: 'Ordered' },
            { value: 'in-production', label: 'Production' },
            { value: 'delivered', label: 'Delivered' },
          ].map((filter) => (
            <Pressable
              key={filter.value}
              onPress={() => setFilterStatus(filter.value)}
              className={`px-3 py-1.5 rounded-lg ${
                filterStatus === filter.value
                  ? 'bg-blue-500'
                  : 'bg-gray-200 dark:bg-slate-900'
              }`}
            >
              <Text className={`text-sm font-medium ${
                filterStatus === filter.value
                  ? 'text-white'
                  : 'text-gray-600 dark:text-slate-400'
              }`}>
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {filteredOrders.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Package size={48} color="#94a3b8" />
            <Text className="text-gray-500 dark:text-slate-400 text-center mt-4">
              No orders found
            </Text>
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-500 px-6 py-3 rounded-xl active:opacity-70"
            >
              <Text className="text-white font-semibold">Request Quote</Text>
            </Pressable>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <Pressable
              key={order.id}
              onPress={() => setSelectedOrder(order)}
              className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-2xl p-4 mb-3 active:opacity-70"
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                    {order.partName}
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                    {order.supplierName}
                  </Text>
                  <View className={`self-start px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                    <Text className="text-xs font-semibold">{getStatusText(order.status)}</Text>
                  </View>
                </View>
                {order.totalCost && (
                  <View className="items-end">
                    <Text className="text-emerald-500 text-lg font-bold">
                      £{order.totalCost.toLocaleString()}
                    </Text>
                    <Text className="text-gray-500 dark:text-slate-500 text-xs">
                      {order.quantity} units
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center justify-between pt-3 border-t border-gray-300 dark:border-slate-700">
                <View className="flex-row items-center">
                  <Calendar size={14} color="#64748b" />
                  <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                    {order.expectedDeliveryDate || 'TBD'}
                  </Text>
                </View>
                {order.unitCost && (
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">
                    £{order.unitCost}/unit
                  </Text>
                )}
              </View>
            </Pressable>
          ))
        )}

        {/* Info Card */}
        <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-4 mb-6">
          <Text className="text-blue-900 dark:text-blue-100 font-semibold mb-2">
            💡 Cloud Manufacturing
          </Text>
          <Text className="text-blue-800 dark:text-blue-200 text-sm leading-5">
            Track all your supplier orders in one place. Request quotes, monitor production status, and manage delivery timelines for your hardware manufacturing.
          </Text>
        </View>
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal visible={selectedOrder !== null} transparent animationType="fade" onRequestClose={() => setSelectedOrder(null)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          {selectedOrder && (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '85%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-700">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white text-xl font-bold">
                      {selectedOrder.partName}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400">
                      {selectedOrder.supplierName}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelectedOrder(null)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="flex-1 px-6 py-4">
                {/* Status Badge */}
                <View className={`self-start px-3 py-1.5 rounded-lg mb-4 ${getStatusColor(selectedOrder.status)}`}>
                  <Text className="text-sm font-semibold">{getStatusText(selectedOrder.status)}</Text>
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Description</Text>
                  <Text className="text-gray-900 dark:text-white">{selectedOrder.description}</Text>
                </View>

                {/* Details Grid */}
                <View className="bg-gray-200 dark:bg-slate-900 rounded-xl p-4 mb-4">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-600 dark:text-slate-400">Quantity:</Text>
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {selectedOrder.quantity} units
                    </Text>
                  </View>
                  {selectedOrder.unitCost && (
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-gray-600 dark:text-slate-400">Unit Cost:</Text>
                      <Text className="text-gray-900 dark:text-white font-semibold">
                        £{selectedOrder.unitCost}
                      </Text>
                    </View>
                  )}
                  {selectedOrder.totalCost && (
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-gray-600 dark:text-slate-400">Total Cost:</Text>
                      <Text className="text-emerald-500 text-lg font-bold">
                        £{selectedOrder.totalCost.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-600 dark:text-slate-400">Requested By:</Text>
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {selectedOrder.requestedBy}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600 dark:text-slate-400">Expected Delivery:</Text>
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {selectedOrder.expectedDeliveryDate || 'TBD'}
                    </Text>
                  </View>
                </View>

                {selectedOrder.notes && (
                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Notes</Text>
                    <Text className="text-gray-900 dark:text-white">{selectedOrder.notes}</Text>
                  </View>
                )}

                {/* Actions */}
                <Pressable
                  onPress={() => {
                    setSelectedOrder(null);
                    Alert.alert('Coming Soon', 'Order updates and tracking coming soon!');
                  }}
                  className="bg-blue-500 py-4 rounded-xl active:opacity-70"
                >
                  <Text className="text-white text-center font-bold">Update Order Status</Text>
                </Pressable>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Create Order Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/70 justify-center items-center px-6">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '80%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-700">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">
                    Request Quote
                  </Text>
                  <Pressable onPress={() => setShowCreateModal(false)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="flex-1 px-6 py-4" keyboardShouldPersistTaps="handled">
              <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                <Text className="text-blue-900 dark:text-blue-100 text-sm">
                  Fill out the form below to request a quote from your supplier. They'll respond with pricing and lead times.
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Part Name</Text>
                <TextInput
                  placeholder="e.g., Custom PCB Assembly"
                  placeholderTextColor="#94a3b8"
                  className="bg-gray-200 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Quantity</Text>
                <TextInput
                  placeholder="e.g., 1000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  className="bg-gray-200 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Description</Text>
                <TextInput
                  placeholder="Detailed specifications..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-gray-200 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white min-h-[100px]"
                />
              </View>

              <Pressable
                onPress={() => {
                  setShowCreateModal(false);
                  Alert.alert('Quote Requested', 'Your quote request has been sent to the supplier.');
                }}
                className="bg-blue-500 py-4 rounded-xl active:opacity-70"
              >
                <Text className="text-white text-center font-bold">Send Quote Request</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
