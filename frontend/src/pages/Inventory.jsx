
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash, 
  Package,
  X
} from 'lucide-react';

const Inventory = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameGujarati: '',
    quantity: 0,
    price: 0,
    description: '',
    image: ''
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      toast.error('Only admins can access inventory management');
    }
  }, [isAdmin, navigate]);

  // Fetch inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const data = await getInventory();
        setInventory(data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast.error('Failed to load inventory data');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? Number(value) : value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const newItem = await addInventoryItem(formData);
      setInventory(prev => [...prev, newItem]);
      toast.success('Item added successfully');
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        nameGujarati: '',
        quantity: 0,
        price: 0,
        description: '',
        image: ''
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedItem = await updateInventoryItem(currentItem._id, formData);
      setInventory(prev => 
        prev.map(item => item._id === currentItem._id ? updatedItem : item)
      );
      toast.success('Item updated successfully');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInventoryItem(currentItem._id);
      setInventory(prev => prev.filter(item => item._id !== currentItem._id));
      toast.success('Item deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const openEditDialog = (item) => {
    setCurrentItem(item);
    setFormData({
      name: item.name,
      nameGujarati: item.nameGujarati,
      quantity: item.quantity,
      price: item.price,
      description: item.description || '',
      image: item.image || ''
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item) => {
    setCurrentItem(item);
    setIsDeleteDialogOpen(true);
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nameGujarati.includes(searchTerm) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button 
          onClick={() => {
            setFormData({
              name: '',
              nameGujarati: '',
              quantity: 0,
              price: 0,
              description: '',
              image: ''
            });
            setIsAddDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary-hover"
        >
          <Plus size={18} className="mr-2" />
          Add Item
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search size={18} className="text-gray-400" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none focus:ring-0 pl-0"
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSearchTerm('')}
                className="hover:bg-transparent"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {filteredInventory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => (
            <Card key={item._id} className="overflow-hidden">
              <div className="p-4 flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-light p-2 rounded-full">
                    <Package size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-gray-500 text-sm">{item.nameGujarati}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => openEditDialog(item)}
                    className="hover:bg-primary-light hover:text-primary"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => openDeleteDialog(item)}
                    className="hover:bg-red-100 hover:text-red-500"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
              <CardContent className="pt-0">
                <div className="flex justify-between text-sm border-t pt-4 mt-2">
                  <span className="text-gray-500">Quantity:</span>
                  <span className="font-medium">{item.quantity}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-medium">₹{item.price}</span>
                </div>
                {item.description && (
                  <div className="border-t pt-2 mt-2">
                    <span className="text-xs text-gray-500">Description:</span>
                    <p className="text-sm mt-1">{item.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-500 mb-1">No items found</h3>
          <p className="text-gray-400 mb-4">
            {inventory.length === 0
              ? "You haven't added any inventory items yet."
              : "No items match your search criteria."
            }
          </p>
          {inventory.length === 0 && (
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-primary hover:bg-primary-hover"
            >
              <Plus size={18} className="mr-2" />
              Add First Item
            </Button>
          )}
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Add a new item to your inventory. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name (English) *</label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="nameGujarati" className="text-sm font-medium">Name (ગુજરાતી) *</label>
                  <Input
                    id="nameGujarati"
                    name="nameGujarati"
                    value={formData.nameGujarati}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-medium">Quantity *</label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">Price (₹) *</label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="image" className="text-sm font-medium">Image URL</label>
                <Input
                  id="image"
                  name="image"
                  type="url"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary-hover">
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the details of this inventory item.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-name" className="text-sm font-medium">Name (English) *</label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-nameGujarati" className="text-sm font-medium">Name (ગુજરાતી) *</label>
                  <Input
                    id="edit-nameGujarati"
                    name="nameGujarati"
                    value={formData.nameGujarati}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-quantity" className="text-sm font-medium">Quantity *</label>
                  <Input
                    id="edit-quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-price" className="text-sm font-medium">Price (₹) *</label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-image" className="text-sm font-medium">Image URL</label>
                <Input
                  id="edit-image"
                  name="image"
                  type="url"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary-hover">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {currentItem?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleDelete} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
