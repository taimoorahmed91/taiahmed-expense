import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { Edit, Coffee, Search, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  total_amount: number;
  order_status: string;
  order_code: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const OrderList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    created_at: '',
    updated_at: ''
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    // Convert timestamps to datetime-local format
    const createdDateTime = order.created_at 
      ? new Date(order.created_at).toISOString().slice(0, 16)
      : '';
    const updatedDateTime = order.updated_at 
      ? new Date(order.updated_at).toISOString().slice(0, 16) 
      : '';
    
    setEditForm({
      created_at: createdDateTime,
      updated_at: updatedDateTime
    });
  };

  const handleUpdate = async () => {
    if (!editingOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          created_at: editForm.created_at ? new Date(editForm.created_at).toISOString() : null,
          updated_at: editForm.updated_at ? new Date(editForm.updated_at).toISOString() : null
        })
        .eq('id', editingOrder.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order updated successfully",
      });

      setEditingOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading orders...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Order Management</h2>
        <p className="text-muted-foreground">View and edit your order timestamps</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card className="border-2 border-muted/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-secondary/50">
              <Coffee className="w-5 h-5 text-secondary-foreground" />
            </div>
            All Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Coffee className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No orders found</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-5 border-2 rounded-xl bg-gradient-to-r from-card to-card/90 hover:shadow-md transition-all duration-200 border-muted/30">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{order.total_amount?.toFixed(2)} zł</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Order #{order.order_code}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={order.order_status === 'completed' ? 'default' : 'secondary'}>
                        {order.order_status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Created {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Edit Dialog */}
                  <Dialog open={editingOrder?.id === order.id} onOpenChange={(open) => !open && setEditingOrder(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(order)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Order Timestamps</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="created_at">Created Date & Time</Label>
                          <Input
                            id="created_at"
                            type="datetime-local"
                            value={editForm.created_at}
                            onChange={(e) => setEditForm({...editForm, created_at: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="updated_at">Updated Date & Time</Label>
                          <Input
                            id="updated_at"
                            type="datetime-local"
                            value={editForm.updated_at}
                            onChange={(e) => setEditForm({...editForm, updated_at: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleUpdate} className="flex-1">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Update
                          </Button>
                          <Button variant="outline" onClick={() => setEditingOrder(null)} className="flex-1">
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};