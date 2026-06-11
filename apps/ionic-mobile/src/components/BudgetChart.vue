<template>
  <div class="chart-container">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const chartData = {
  labels: ['Food', 'Transport', 'Utilities', 'Entertainment'],
  datasets: [
    {
      backgroundColor: ['#3880ff', '#2dd36f', '#ffc409', '#eb445a'],
      data: [40, 20, 30, 10]
    }
  ]
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
};
</script>

<style scoped>
.chart-container {
  height: 200px;
}
</style>
