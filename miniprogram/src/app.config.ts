export default defineAppConfig({
  pages: ["pages/index/index"],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#242526",
    navigationBarTitleText: "北京浮生记",
    navigationBarTextStyle: "white",
    backgroundColor: "#ece8df",
  },
  requiredPrivateInfos: [],
  lazyCodeLoading: "requiredComponents",
});
