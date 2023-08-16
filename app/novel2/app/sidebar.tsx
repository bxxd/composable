import {
  HomeIcon,
  UserIcon,
  BriefcaseIcon,
  MailIcon,
} from "@heroicons/react/solid"; // Import the icons from Heroicons or any other icon library

function Sidebar() {
  return (
    <div className="fixed left-0 top-[headerHeight] flex h-full w-12 flex-col items-center space-y-4 p-5 text-black shadow-md">
      <a href="#">
        <HomeIcon className="h-5 w-4 hover:text-gray-600" />
      </a>
      <a href="#">
        <UserIcon className="h-4 w-4 hover:text-gray-600" />
      </a>
      <a href="#">
        <BriefcaseIcon className="h-4 w-4 hover:text-gray-600" />
      </a>
      <a href="#">
        <MailIcon className="h-4 w-4 hover:text-gray-600" />
      </a>
    </div>
  );
}

export default Sidebar;
