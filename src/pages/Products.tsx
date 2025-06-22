import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Package, Search, Plus, Edit, Trash2, Filter, Download, Upload, AlertTriangle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { productsApi, categoriesApi, unitsApi } from "@/services/api";
import { FilteredProductsModal } from "@/components/FilteredProductsModal";
import { InventorySummaryCards } from "@/components/inventory/InventorySummaryCards";
import { useInventorySummary } from "@/hooks/useInventorySummary";

const Products = () => {
  const { toast } = useToast();
  const { summary, loading: summaryLoading, refetch: refetchSummary } = useInventorySummary();
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);
  const [filteredProductsModal, setFilteredProductsModal] = useState({
    open: false,
    title: '',
    filterType: 'all' as 'lowStock' | 'outOfStock' | 'inStock' | 'all'
  });

  // Debounce search to avoid too many API calls
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchUnits();
    fetchProducts();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts();
    }, 300); // 300ms debounce
    
    setSearchDebounce(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm]);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts();
  }, [categoryFilter, statusFilter]);

  // Handle page changes
  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchAllProductsForModal = async (): Promise<any[]> => {
    try {
      const response = await productsApi.getAll({
        limit: 10000 // Large number to get all products
      });
      
      if (response.success) {
        const productsData = response.data?.products || response.data || [];
        return Array.isArray(productsData) ? productsData : [];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch all products for modal:', error);
      return [];
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };
      
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter === 'low') params.lowStock = true;
      if (statusFilter === 'out') params.outOfStock = true;

      console.log('Fetching products with params:', params);
      const response = await productsApi.getAll(params);
      console.log('Products API response:', response);
      
      if (response.success) {
        const productsData = response.data?.products || response.data || [];
        console.log('Products data:', productsData);
        
        const productsArray = Array.isArray(productsData) ? productsData : [];
        setProducts(productsArray);
        
        // Handle pagination metadata - prioritize API response data
        let finalTotalItems = 0;
        let finalTotalPages = 1;
        
        if (response.data?.pagination) {
          console.log('Using pagination metadata:', response.data.pagination);
          finalTotalPages = response.data.pagination.totalPages || 1;
          finalTotalItems = response.data.pagination.totalItems || 0;
        } else if (response.data?.totalPages) {
          console.log('Using totalPages from response:', response.data.totalPages);
          finalTotalPages = response.data.totalPages;
          finalTotalItems = response.data.totalItems || 0;
        } else {
          // If no pagination info, assume there might be more data
          // Set a reasonable estimate based on current data
          finalTotalItems = productsArray.length;
          finalTotalPages = Math.ceil(finalTotalItems / itemsPerPage);
        }
        
        setTotalPages(finalTotalPages);
        setTotalItems(finalTotalItems);
        
        console.log('Final pagination state:', { 
          currentPage, 
          totalPages: finalTotalPages,
          totalItems: finalTotalItems,
          productsLength: productsArray.length 
        });
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setProductsLoading(false);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      if (response.success && response.data) {
        const categoryList = [
          { value: "all", label: "All Categories" }
        ];
        
        const categories = Array.isArray(response.data) ? response.data : [];
        categories.forEach((cat: any) => {
          if (typeof cat === 'string') {
            categoryList.push({ value: cat, label: cat });
          } else if (cat && typeof cat === 'object' && (cat.name || cat.id)) {
            const name = cat.name || cat.id;
            categoryList.push({ value: name, label: name });
          }
        });
        
        setCategories(categoryList);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([{ value: "all", label: "All Categories" }]);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await unitsApi.getAll();
      if (response.success && response.data) {
        const unitsList: any[] = [];
        
        const units = Array.isArray(response.data) ? response.data : [];
        units.forEach((unit: any) => {
          if (typeof unit === 'string') {
            unitsList.push({ value: unit, label: unit });
          } else if (unit && typeof unit === 'object') {
            unitsList.push({ 
              value: unit.name || unit.value, 
              label: unit.label || unit.name || unit.value 
            });
          }
        });
        
        if (unitsList.length > 0) {
          setUnits(unitsList);
        } else {
          setUnits([
            { value: "pieces", label: "Pieces" },
            { value: "kg", label: "Kilograms" }
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch units:', error);
      setUnits([
        { value: "pieces", label: "Pieces" },
        { value: "kg", label: "Kilograms" }
      ]);
    }
  };

  const handleEditProduct = async (formData: any) => {
    if (!selectedProduct) return;

    try {
      const response = await productsApi.update(selectedProduct.productId || selectedProduct.id, formData);
      if (response.success) {
        setIsEditDialogOpen(false);
        setSelectedProduct(null);
        fetchProducts();
        toast({
          title: "Product Updated",
          description: "Product has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (productId: string | number) => {
    try {
      const response = await productsApi.delete(Number(productId));
      if (response.success) {
        fetchProducts();
        toast({
          title: "Product Deleted",
          description: "Product has been deleted successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const renderPagination = () => {
    console.log('Rendering pagination with:', { totalPages, currentPage, totalItems });
    
    // Always show pagination if we have more than 1 page or if we have data that suggests pagination
    if (totalPages <= 1 && totalItems <= itemsPerPage) {
      console.log('Not showing pagination - total pages:', totalPages, 'total items:', totalItems);
      return null;
    }

    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust range if too close to start or end
      if (currentPage <= 3) {
        end = Math.min(totalPages - 1, 4);
      }
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('ellipsis-start');
      }
      
      // Add pages in range
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page (if different from first)
      if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    console.log('Pagination pages to render:', pages);

    return (
      <div className="flex flex-col items-center space-y-4 mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {pages.map((page, index) => (
              <PaginationItem key={index}>
                {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => setCurrentPage(page as number)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        
        {/* Show pagination info like in the image */}
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products
        </div>
      </div>
    );
  };

  const openFilteredModal = (filterType: 'lowStock' | 'outOfStock' | 'inStock' | 'all', title: string) => {
    setFilteredProductsModal({
      open: true,
      title,
      filterType
    });
  };

  if (loading || summaryLoading) {
    return (
      <div className="flex-1 p-6 space-y-6 min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 space-y-3 min-h-[calc(100vh-65px)] bg-background">
      <div className="flex items-center gap-4">
       
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products Management</h1>
          <p className="text-muted-foreground">Manage your product catalog and inventory</p>
        </div>
      </div>

      {/* Add the inventory summary cards */}
      <InventorySummaryCards 
        summary={summary}
        onCardClick={openFilteredModal}
      />

      <Tabs defaultValue="products" className="space-y-4">
       
        <TabsContent value="products" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <Card>
           
            <CardContent>
              {productsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-lg text-muted-foreground">Searching...</div>
                </div>
              ) : products.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">
                    {searchTerm ? `No products found for "${searchTerm}"` : "No products found"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid m-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {products.map((product) => (
                      <Card key={product.productId || product.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">{product.productName || product.name}</h4>
                                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                                <p className="text-sm text-muted-foreground">Category: {product.category}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Price:</span>
                                <span className="font-medium text-foreground">PKR {product.price?.toLocaleString() || '0'}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Stock:</span>
                                <span className="text-foreground">{product.stock || 0} {product.unit}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {renderPagination()}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Product Dialog */}
      {selectedProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <ProductDialog
            product={selectedProduct}
            categories={categories}
            units={units}
            onSubmit={handleEditProduct}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedProduct(null);
            }}
          />
        </Dialog>
      )}

      {/* Delete Product Dialog */}
      {selectedProduct && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteProduct(selectedProduct.productId || selectedProduct.id);
                  setIsDeleteDialogOpen(false);
                  setSelectedProduct(null);
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Filtered Products Modal */}
      <FilteredProductsModal
        open={filteredProductsModal.open}
        onOpenChange={(open) => setFilteredProductsModal(prev => ({ ...prev, open }))}
        title={filteredProductsModal.title}
        filterType={filteredProductsModal.filterType}
        onFetchAllProducts={fetchAllProductsForModal}
      />
    </div>
  );
};

// Product Dialog Component
const ProductDialog = ({ 
  product, 
  categories, 
  units, 
  onSubmit, 
  onClose 
}: { 
  product: any; 
  categories: any[]; 
  units: any[]; 
  onSubmit: (data: any) => void; 
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: product.productName || product.name || "",
    description: product.description || "",
    category: product.category || "",
    price: product.price?.toString() || "",
    sku: product.sku || "",
    barcode: product.barcode || "",
    unit: product.unit || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseFloat(formData.price)
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Product - {product.productName || product.name}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.filter(cat => cat.value !== "all").map((category) => (
                <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.value || unit.name} value={unit.value || unit.name}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({...formData, barcode: e.target.value})}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Update Product</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default Products;
