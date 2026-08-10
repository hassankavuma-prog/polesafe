# 🧭 Navigation Integration Guide

## Adding New Screens to React Navigation

To make the new attendance screens accessible in the PoleSafe mobile app, you need to register them in the navigation stack.

---

## Step 1: Import the Screens

In your main navigation file (likely `App.js` or `navigation/SchoolNavigator.js`):

```js
import PendingChildren from './screens/PendingChildren';
import AttendanceReport from './screens/AttendanceReport';
```

---

## Step 2: Add to Stack Navigator

If using `@react-navigation/stack`:

```jsx
const SchoolStack = createStackNavigator();

function SchoolNavigator() {
  return (
    <SchoolStack.Navigator
      initialRouteName="SchoolDashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#1565C0' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <SchoolStack.Screen 
        name="SchoolDashboard" 
        component={SchoolDashboard}
        options={{ title: 'School Dashboard' }}
      />
      
      {/* Existing screens */}
      <SchoolStack.Screen 
        name="Broadcast" 
        component={Broadcast}
        options={{ title: 'Send Broadcast' }}
      />
      <SchoolStack.Screen 
        name="GateCheck" 
        component={GateCheck}
        options={{ title: 'Gate Check-In' }}
      />
      <SchoolStack.Screen 
        name="Detention" 
        component={Detention}
        options={{ title: 'Detention / Late Pickup' }}
      />
      
      {/* NEW SCREENS */}
      <SchoolStack.Screen 
        name="PendingChildren" 
        component={PendingChildren}
        options={{ title: 'Pending Children' }}
      />
      <SchoolStack.Screen 
        name="AttendanceReport" 
        component={AttendanceReport}
        options={{ title: 'Attendance Report' }}
      />
    </SchoolStack.Navigator>
  );
}
```

---

## Step 3: Navigation Already Wired

The SchoolDashboard.js already has navigation calls:

```jsx
<TouchableOpacity onPress={() => navigation.navigate('PendingChildren')}>
  {/* ... */}
</TouchableOpacity>

<TouchableOpacity onPress={() => navigation.navigate('AttendanceReport')}>
  {/* ... */}
</TouchableOpacity>
```

These will work once screens are registered in Step 2.

---

## Step 4: (Optional) Tab Navigation

If using bottom tabs for school admins:

```jsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

function SchoolTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Dashboard" 
        component={SchoolDashboard}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="dashboard" size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Pending" 
        component={PendingChildren}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="person-add" size={size} color={color} />,
          tabBarBadge: pendingCount > 0 ? pendingCount : null, // Requires global state
        }}
      />
      <Tab.Screen 
        name="Attendance" 
        component={AttendanceReport}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="checklist" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
```

---

## Step 5: Deep Linking (Optional)

For notifications to open directly to pending children:

```js
const linking = {
  prefixes: ['polesafe://', 'https://polesafe.ug'],
  config: {
    screens: {
      School: {
        screens: {
          PendingChildren: 'pending',
          AttendanceReport: 'attendance',
        },
      },
    },
  },
};

<NavigationContainer linking={linking}>
  {/* ... */}
</NavigationContainer>
```

---

## Quick Test

1. Add screens to navigator
2. Run: `npm start` or `expo start`
3. Login as school admin
4. Tap "Pending Children" on dashboard
5. Verify screen loads with pending list

---

## Troubleshooting

### "Cannot read property 'navigate' of undefined"
- Ensure component receives `navigation` prop from Stack.Screen
- For nested components, use `import { useNavigation } from '@react-navigation/native';`

### "The action 'NAVIGATE' with payload ... was not handled"
- Screen name in `navigation.navigate('X')` must match `<Stack.Screen name="X">`
- Case-sensitive!

### Pending count not showing in badge
- Need global state (Context API or Redux) to share count across tabs
- Alternative: Re-fetch in each tab's `useFocusEffect`

---

## Next Steps

1. Register screens in navigation
2. Test all flows end-to-end
3. Add loading states for better UX
4. Implement error boundaries
5. Add analytics tracking for school admin actions
