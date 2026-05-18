import { Outlet } from "react-router-dom";

const App = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <h1>Welcome to Shared Folder Template!</h1>
      <Outlet />
    </div>
  );
};

export default App;
