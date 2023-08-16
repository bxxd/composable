import {
  HomeIcon,
  UserIcon,
  BriefcaseIcon,
  MailIcon,
} from "@heroicons/react/solid"; // Import the icons from Heroicons or any other icon library

function Sidebar() {
  return (
    <div className="fixed left-0 top-[headerHeight] h-full w-16 bg-stone-200 text-black p-5 shadow-md flex flex-col items-center space-y-4">
      <a href="#">
        <HomeIcon className="h-6 w-6 hover:text-gray-600" />
      </a>
      <a href="#">
        <UserIcon className="h-6 w-6 hover:text-gray-600" />
      </a>
      <a href="#">
        <BriefcaseIcon className="h-6 w-6 hover:text-gray-600" />
      </a>
      <a href="#">
        <MailIcon className="h-6 w-6 hover:text-gray-600" />
      </a>
    </div>
  );
}

export default Sidebar;
