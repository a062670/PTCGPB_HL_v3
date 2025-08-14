/**
 * 卡片列表組件
 * 提供統一的卡片列表渲染邏輯
 */

// 卡片列表組件定義
const CardListComponent = {
  name: "CardList",
  props: {
    cardStore: {
      type: Array,
      default: () => [],
    },
    cards: {
      type: Array,
      required: true,
      default: () => [],
    },
    substitutionItems: {
      type: Array,
      default: () => [],
    },
    cardType: {
      type: String,
      default: "card",
      validator: (value) => ["card", "cardInstance"].includes(value),
    },
    showEmpty: {
      type: Boolean,
      default: true,
    },
    emptyText: {
      type: String,
      default: "無卡片",
    },
  },
  computed: {
    hasCards() {
      if (this.cards && Array.isArray(this.cards) && this.cards.length > 0) {
        return true;
      }
      if (
        this.substitutionItems &&
        Array.isArray(this.substitutionItems) &&
        this.substitutionItems.length > 0
      ) {
        return true;
      }
      return false;
    },
    cardsList() {
      if (this.cardType === "cardInstance") {
        return this.cards.map((card) => card.cardInstance);
      }
      return this.cards;
    },
  },
  methods: {
    getCardClasses(card) {
      const classes = [];

      if (card.disable) {
        classes.push("border-lg border-primary border-opacity-100 rounded-xl");
      }
      if (card.isSnooped) {
        classes.push("border-lg border-warning border-opacity-100 rounded-xl");
      }

      return classes;
    },
    getItemName(name) {
      switch (name) {
        default:
          return name.replace("List", "");
      }
    },
  },
  template: `
    <div class="d-flex ga-2 mt-2 align-center flex-wrap">
      <template v-if="hasCards">
        <div
          v-for="(card, index) in cardsList"
          :key="\`\${card.cardId}-\${index}\`"
          class="position-relative"
        >
          <img
            :src="\`https://car-fs.gagu.dev/PackViewer/images/\${card.cardId}.png\`"
            width="100"
            :class="getCardClasses(card)"
          />
          <div
            v-if="cardStore.length > 0 && !cardStore.some((item) => item === card.cardId)"
            class="position-absolute top-0 right-0 bg-warning text-white rounded-circle px-1"
          >
            NEW
          </div>
        </div>
        <div v-for="(item, idx) in substitutionItems" :key="idx">
          <div :class="getCardClasses(item)" style="width: 200px;">
            <div v-for="(_item, idx) in item.item" :key="idx">
              {{ getItemName(_item.name) }} ({{ _item.amount }})
            </div>
          </div>
        </div>
      </template>
      <div v-else-if="showEmpty" class="text-muted">
        {{ emptyText }}
      </div>
    </div>
  `,
};

// 註冊組件到全局 Vue 實例
function registerCardListComponent(Vue) {
  Vue.component("CardList", CardListComponent);
}

// 導出組件和註冊函數
export { CardListComponent, registerCardListComponent };

// 默認導出註冊函數
export default registerCardListComponent;
