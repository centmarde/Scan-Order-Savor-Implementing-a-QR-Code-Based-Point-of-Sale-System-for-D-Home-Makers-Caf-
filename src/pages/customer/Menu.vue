<template>
  <v-container fluid class="pa-0">
    <!-- Header Section -->
    <v-card color="primary" class="mb-6">
      <v-card-text class="text-center py-8">
        <h1 class="text-h3 font-weight-bold text-white mb-4">Our Menu</h1>
        <p class="text-h6 text-white opacity-90">
          Discover our delicious selection of carefully crafted dishes
        </p>
      </v-card-text>
    </v-card>

    <!-- Best Sellers Section -->
    <v-container class="mb-8">
      <div class="text-center mb-6">
        <h2
          class="text-h4 font-weight-bold mb-2 d-flex align-center justify-center"
        >
          <v-icon color="warning" size="32" class="mr-2">mdi-star</v-icon>
          Best Sellers
        </h2>
        <p class="text-subtitle-1 text-grey-darken-1">
          Our most popular dishes loved by customers
        </p>
      </div>

      <v-row>
        <v-col
          v-for="item in bestSellers"
          :key="item.id"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card
            elevation="4"
            rounded="xl"
            class="h-100"
            style="border: 2px solid #ffd700"
          >
            <div style="position: relative">
              <v-img :src="item.image" :alt="item.name" height="200" cover />
              <v-chip
                color="warning"
                size="small"
                class="ma-2"
                style="position: absolute; top: 0; left: 0"
                prepend-icon="mdi-star"
                variant="flat"
              >
                Best Seller
              </v-chip>
            </div>

            <v-card-text>
              <h3 class="text-h6 font-weight-bold mb-2">{{ item.name }}</h3>
              <p class="text-body-2 text-grey-darken-1 mb-4">
                {{ item.description }}
              </p>

              <div class="d-flex justify-space-between align-center">
                <div class="text-h6 font-weight-bold text-success">
                  ${{ item.price.toFixed(2) }}
                </div>
                <v-btn
                  @click="addToCart(item)"
                  color="primary"
                  size="small"
                  rounded="lg"
                  prepend-icon="mdi-plus"
                >
                  Add
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Menu Categories Section -->
    <v-container>
      <!-- Category Filter Tabs -->
      <div class="text-center mb-6">
        <v-chip-group
          v-model="selectedCategory"
          selected-class="text-primary"
          mandatory
        >
          <v-chip
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
            size="large"
            class="ma-1"
            :prepend-icon="category.icon"
          >
            {{ category.name }}
          </v-chip>
        </v-chip-group>
      </div>

      <!-- Menu Items by Category -->
      <div v-for="category in categories" :key="category.id">
        <div
          v-if="selectedCategory === category.id || selectedCategory === null"
        >
          <v-card class="mb-6" elevation="2" rounded="xl">
            <v-card-text class="text-center py-6">
              <h2
                class="text-h4 font-weight-bold mb-2 d-flex align-center justify-center"
              >
                <v-icon :color="category.color" size="28" class="mr-2">
                  {{ category.icon }}
                </v-icon>
                {{ category.name }}
              </h2>
              <p class="text-subtitle-1 text-grey-darken-1">
                {{ category.description }}
              </p>
            </v-card-text>
          </v-card>

          <v-row class="mb-8">
            <v-col
              v-for="item in getItemsByCategory(category.id)"
              :key="item.id"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card elevation="4" rounded="xl" class="h-100">
                <div style="position: relative">
                  <v-img
                    :src="item.image"
                    :alt="item.name"
                    height="200"
                    cover
                  />
                  <v-chip
                    v-if="item.isSpicy"
                    color="red"
                    size="x-small"
                    class="ma-2"
                    style="position: absolute; top: 0; right: 0"
                    icon="mdi-chili-hot"
                    variant="flat"
                  />
                  <v-chip
                    v-if="item.isVegetarian"
                    color="green"
                    size="x-small"
                    class="ma-2"
                    style="position: absolute; top: 0; right: 0"
                    icon="mdi-leaf"
                    variant="flat"
                  />
                </div>

                <v-card-text>
                  <h3 class="text-h6 font-weight-bold mb-2">{{ item.name }}</h3>
                  <p class="text-body-2 text-grey-darken-1 mb-3">
                    {{ item.description }}
                  </p>

                  <div v-if="item.tags?.length" class="mb-3">
                    <v-chip
                      v-for="tag in item.tags"
                      :key="tag"
                      size="x-small"
                      variant="outlined"
                      class="ma-1"
                    >
                      {{ tag }}
                    </v-chip>
                  </div>

                  <div class="d-flex justify-space-between align-center">
                    <div class="text-h6 font-weight-bold text-success">
                      ${{ item.price.toFixed(2) }}
                    </div>
                    <v-btn
                      @click="addToCart(item)"
                      color="primary"
                      size="small"
                      rounded="lg"
                      prepend-icon="mdi-plus"
                    >
                      Add
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </div>
    </v-container>

    <!-- Cart Summary (Fixed Bottom) -->
    <v-bottom-navigation v-if="cartItems.length > 0" class="d-flex">
      <v-container class="d-flex justify-space-between align-center py-2">
        <div>
          <div class="text-caption text-grey-darken-1">
            {{ cartItems.length }} items
          </div>
          <div class="text-h6 font-weight-bold">
            ${{ cartTotal.toFixed(2) }}
          </div>
        </div>
        <v-btn
          @click="viewCart"
          color="success"
          size="large"
          rounded="lg"
          prepend-icon="mdi-cart"
        >
          View Cart
        </v-btn>
      </v-container>
    </v-bottom-navigation>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Data structures
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: number;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  tags?: string[];
  isBestSeller?: boolean;
}

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Reactive data
const selectedCategory = ref<number | null>(null);
const cartItems = ref<MenuItem[]>([]);

// Categories data
const categories = ref<Category[]>([
  {
    id: 1,
    name: "Appetizers",
    description: "Start your meal with these delicious appetizers",
    icon: "mdi-food-apple",
    color: "orange",
  },
  {
    id: 2,
    name: "Main Courses",
    description: "Hearty and satisfying main dishes",
    icon: "mdi-silverware-fork-knife",
    color: "red",
  },
  {
    id: 3,
    name: "Pasta & Rice",
    description: "Comforting pasta and rice dishes",
    icon: "mdi-pasta",
    color: "amber",
  },
  {
    id: 4,
    name: "Desserts",
    description: "Sweet treats to end your meal perfectly",
    icon: "mdi-cupcake",
    color: "pink",
  },
  {
    id: 5,
    name: "Beverages",
    description: "Refreshing drinks and beverages",
    icon: "mdi-cup",
    color: "blue",
  },
]);

// Menu items data
const menuItems = ref<MenuItem[]>([
  // Appetizers
  {
    id: 1,
    name: "Crispy Calamari",
    description: "Fresh squid rings served with marinara sauce and lemon",
    price: 12.99,
    image:
      "https://images.unsplash.com/photo-1559847844-d721426d6edc?w=400&h=300&fit=crop",
    categoryId: 1,
    tags: ["Seafood", "Crispy"],
    isBestSeller: true,
  },
  {
    id: 2,
    name: "Buffalo Wings",
    description: "Spicy chicken wings with blue cheese dip",
    price: 10.99,
    image:
      "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop",
    categoryId: 1,
    isSpicy: true,
    tags: ["Chicken", "Spicy"],
  },
  {
    id: 3,
    name: "Mozzarella Sticks",
    description: "Golden fried mozzarella with marinara sauce",
    price: 8.99,
    image:
      "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=400&h=300&fit=crop",
    categoryId: 1,
    isVegetarian: true,
    tags: ["Cheese", "Vegetarian"],
  },

  // Main Courses
  {
    id: 4,
    name: "Grilled Salmon",
    description: "Fresh Atlantic salmon with lemon herb butter and vegetables",
    price: 24.99,
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
    categoryId: 2,
    tags: ["Seafood", "Healthy", "Grilled"],
    isBestSeller: true,
  },
  {
    id: 5,
    name: "Ribeye Steak",
    description: "Prime cut ribeye steak cooked to perfection",
    price: 32.99,
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
    categoryId: 2,
    tags: ["Beef", "Premium", "Grilled"],
  },
  {
    id: 6,
    name: "Chicken Parmesan",
    description: "Breaded chicken breast with marinara and mozzarella",
    price: 19.99,
    image:
      "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=300&fit=crop",
    categoryId: 2,
    tags: ["Chicken", "Italian", "Cheese"],
    isBestSeller: true,
  },

  // Pasta & Rice
  {
    id: 7,
    name: "Spaghetti Carbonara",
    description: "Classic Italian pasta with eggs, cheese, and pancetta",
    price: 16.99,
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop",
    categoryId: 3,
    tags: ["Pasta", "Italian", "Creamy"],
  },
  {
    id: 8,
    name: "Seafood Paella",
    description: "Traditional Spanish rice dish with mixed seafood",
    price: 22.99,
    image:
      "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=300&fit=crop",
    categoryId: 3,
    tags: ["Rice", "Seafood", "Spanish"],
    isBestSeller: true,
  },
  {
    id: 9,
    name: "Mushroom Risotto",
    description: "Creamy arborio rice with wild mushrooms and parmesan",
    price: 18.99,
    image:
      "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop",
    categoryId: 3,
    isVegetarian: true,
    tags: ["Rice", "Mushroom", "Vegetarian"],
  },

  // Desserts
  {
    id: 10,
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with molten center and vanilla ice cream",
    price: 8.99,
    image:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop",
    categoryId: 4,
    tags: ["Chocolate", "Warm", "Ice Cream"],
  },
  {
    id: 11,
    name: "Tiramisu",
    description: "Classic Italian dessert with coffee-soaked ladyfingers",
    price: 7.99,
    image:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop",
    categoryId: 4,
    tags: ["Italian", "Coffee", "Creamy"],
  },

  // Beverages
  {
    id: 12,
    name: "Fresh Lemonade",
    description: "House-made lemonade with fresh lemons",
    price: 4.99,
    image:
      "https://images.unsplash.com/photo-1523371683702-25fa5c4e7edf?w=400&h=300&fit=crop",
    categoryId: 5,
    tags: ["Fresh", "Citrus", "Non-alcoholic"],
  },
  {
    id: 13,
    name: "Craft Beer",
    description: "Selection of local craft beers on tap",
    price: 6.99,
    image:
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop",
    categoryId: 5,
    tags: ["Beer", "Local", "Alcoholic"],
  },
]);

// Computed properties
const bestSellers = computed(() => {
  return menuItems.value.filter((item) => item.isBestSeller);
});

const cartTotal = computed(() => {
  return cartItems.value.reduce((total, item) => total + item.price, 0);
});

// Methods
const getItemsByCategory = (categoryId: number) => {
  return menuItems.value.filter(
    (item) => item.categoryId === categoryId && !item.isBestSeller
  );
};

const addToCart = (item: MenuItem) => {
  cartItems.value.push({ ...item });
  // You could add a toast notification here
};

const viewCart = () => {
  // Navigate to cart page (you'll need to create this)
  router.push("/customer/cart");
};

// Lifecycle
onMounted(() => {
  // Set first category as default
  selectedCategory.value = categories.value[0]?.id || null;
});
</script>

<!-- No custom CSS. All styling is handled by Vuetify props and classes. -->
