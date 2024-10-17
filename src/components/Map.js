import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// Car icon for the Marker
const carIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png', // URL for car icon
  iconSize: [40, 40], // Size of the icon
  iconAnchor: [20, 40], // Anchor point of the icon
});

const Map = () => {
  const [vehiclePosition, setVehiclePosition] = useState([19.86093, 75.31090]);
  const [path, setPath] = useState([]); // To store the path
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date
  const [animationInterval, setAnimationInterval] = useState(null); // To store the interval ID

  // Function to fetch vehicle data for a specific date
  const fetchVehicleData = async (selectedDate) => {
    try {
      const response = await axios.get('http://localhost:5000/api/vehicle-location', {
        params: { date: selectedDate },
      });
      const data = response.data;

      if (data && data.length > 0) {
        const pathData = data.map((loc) => [loc.latitude, loc.longitude]);
        setPath(pathData);
        setVehiclePosition(pathData[0]); // Start at the first position
        animateVehicle(data); // Start animating vehicle with the fetched data
      } else {
        // Handle case where no data is found for the selected date
        setPath([]);
        setVehiclePosition([19.86093, 75.31090]); // Reset position if no data
        alert('No data available for the selected date.');
      }
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
    }
  };

  // Function to animate the vehicle marker along the path
  const animateVehicle = (data) => {
    let index = 0;
    const totalPoints = data.length;

    // Clear the existing interval if it exists
    if (animationInterval) {
      clearInterval(animationInterval);
    }

    const newInterval = setInterval(() => {
      if (index < totalPoints) {
        const { latitude, longitude } = data[index];
        setVehiclePosition([latitude, longitude]);
        index++;
      } else {
        clearInterval(newInterval); // Stop animation when all points are reached
      }
    }, 1000); // Change every second (adjust time as needed)

    setAnimationInterval(newInterval); // Store the new interval
  };

  useEffect(() => {
    fetchVehicleData(date); // Fetch data for the current date when the component loads
  }, [date]);

  // Function to handle date changes
  const handleDateChange = (e) => {
    setDate(e.target.value); // Update the date based on user input
    fetchVehicleData(e.target.value); // Fetch new data based on the selected date
  };

  // Function to get yesterday's date in YYYY-MM-DD format
  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  return (
    <div>
      <h1>Vehicle Movement on Leaflet Map</h1>

      {/* Date Picker to select a specific date */}
      <label>Select Date: </label>
      <input type="date" value={date} onChange={handleDateChange} />

      {/* Button to show yesterday's route */}
      <button onClick={() => fetchVehicleData(getYesterdayDate())}>
        Show Yesterday's Route
      </button>

      <MapContainer center={vehiclePosition} zoom={15} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Marker for the vehicle */}
        <Marker position={vehiclePosition} icon={carIcon}>
          <Popup>
            <div>
              <h3>Vehicle Information</h3>
              <p>Current Position: {vehiclePosition[0]}, {vehiclePosition[1]}</p>
              <p>Timestamp: {new Date().toLocaleString()}</p>
            </div>
          </Popup>
        </Marker>

        {/* Polyline to show the vehicle's route */}
        {path.length > 0 && <Polyline positions={path} color="green" />} {/* Green line for the route */}
      </MapContainer>
    </div>
  );
};

export default Map;
